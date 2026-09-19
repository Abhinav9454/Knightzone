package com.collegecontest.judge.service;

import com.collegecontest.judge.dto.SubmissionRequest;
import com.collegecontest.judge.dto.SubmissionResult;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.command.ExecCreateCmdResponse;
import com.github.dockerjava.api.command.InspectContainerResponse;
import com.github.dockerjava.api.exception.NotFoundException;
import com.github.dockerjava.api.model.Capability;
import com.github.dockerjava.api.model.HostConfig;
import com.github.dockerjava.api.model.Ulimit;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.core.command.PullImageResultCallback;
import com.github.dockerjava.transport.DockerHttpClient;
import com.github.dockerjava.zerodep.ZerodepDockerHttpClient;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.apache.commons.compress.archivers.tar.TarArchiveEntry;
import org.apache.commons.compress.archivers.tar.TarArchiveOutputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermission;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Stream;

@Service
@ConditionalOnProperty(name = "judge.docker.enabled", havingValue = "true", matchIfMissing = false)
public class DockerExecutionService {

    private static final Logger log = LoggerFactory.getLogger(DockerExecutionService.class);
    private static final int COMPILE_ERROR_EXIT_CODE = 42;
    private static final int DEFAULT_TIME_LIMIT_SECONDS = 5;
    private static final int DEFAULT_MEMORY_MB = 256;
    private static final double DEFAULT_CPUS = 0.5;

    private static final Map<String, String> IMAGE_BY_LANG = Map.ofEntries(
            Map.entry("java", "eclipse-temurin:17-jdk"),
            Map.entry("python", "python:3.11-slim"),
            Map.entry("py", "python:3.11-slim"),
            Map.entry("node", "node:18-slim"),
            Map.entry("js", "node:18-slim"),
            Map.entry("javascript", "node:18-slim"),
            Map.entry("cpp", "gcc:12"),
            Map.entry("c", "gcc:12"),
            Map.entry("c++", "gcc:12"));

    private final DockerClient dockerClient;
    private final Set<String> warmedImages = ConcurrentHashMap.newKeySet();
    private final Set<String> managedWorkerContainerIds = ConcurrentHashMap.newKeySet();
    private final Map<String, Semaphore> languageSemaphores = new ConcurrentHashMap<>();
    private final Map<String, BlockingQueue<WorkerContainer>> workerPools = new ConcurrentHashMap<>();
    private final Map<String, AtomicInteger> workerCounts = new ConcurrentHashMap<>();
    private Semaphore globalExecutionSemaphore = new Semaphore(16, true);
    private ExecutorService waitExecutor = Executors.newFixedThreadPool(32);

    @Value("${judge.docker.pull-on-demand:false}")
    private boolean pullOnDemand;

    @Value("${judge.execution.wait-thread-pool-size:32}")
    private int waitThreadPoolSize;

    @Value("${judge.execution.max-active-containers:16}")
    private int maxActiveContainers;

    @Value("${judge.execution.queue-wait-timeout-ms:2000}")
    private long executionQueueWaitTimeoutMs;

    @Value("${judge.execution.language-limit-java:6}")
    private int languageLimitJava;

    @Value("${judge.execution.language-limit-python:8}")
    private int languageLimitPython;

    @Value("${judge.execution.language-limit-cpp:8}")
    private int languageLimitCpp;

    @Value("${judge.execution.language-limit-node:4}")
    private int languageLimitNode;

    @Value("${judge.execution.batch-mode-enabled:true}")
    private boolean batchModeEnabled;

    @Value("${judge.execution.worker-pool-enabled:true}")
    private boolean workerPoolEnabled;

    @Value("${judge.execution.worker-pool-initial-size:1}")
    private int workerPoolInitialSize;

    @Value("${judge.execution.worker-pool-max-per-language:0}")
    private int workerPoolMaxPerLanguage;

    public DockerExecutionService() {
        String dockerHost = System.getenv().getOrDefault(
                "JUDGE_DOCKER_HOST",
                System.getenv().getOrDefault("DOCKER_HOST", "unix:///var/run/docker.sock"));

        DockerClientConfig config = DefaultDockerClientConfig.createDefaultConfigBuilder()
                .withDockerHost(dockerHost)
                .build();

        DockerHttpClient httpClient = new ZerodepDockerHttpClient.Builder()
                .dockerHost(config.getDockerHost())
                .sslConfig(config.getSSLConfig())
                .build();

        this.dockerClient = DockerClientImpl.getInstance(config, httpClient);
    }

    @PostConstruct
    public void initializeExecutors() {
        int size = Math.max(4, waitThreadPoolSize);
        waitExecutor = Executors.newFixedThreadPool(size);
        globalExecutionSemaphore = new Semaphore(Math.max(4, maxActiveContainers), true);
        languageSemaphores.clear();
        languageSemaphores.put("java", new Semaphore(Math.max(1, languageLimitJava), true));
        languageSemaphores.put("python", new Semaphore(Math.max(1, languageLimitPython), true));
        languageSemaphores.put("cpp", new Semaphore(Math.max(1, languageLimitCpp), true));
        languageSemaphores.put("node", new Semaphore(Math.max(1, languageLimitNode), true));
        initializeWorkerPool();
    }

    @PreDestroy
    public void shutdownExecutors() {
        shutdownWorkerPool();
        if (waitExecutor != null) {
            waitExecutor.shutdownNow();
        }
    }

    public Set<String> defaultRuntimeImages() {
        return new LinkedHashSet<>(IMAGE_BY_LANG.values());
    }

    public void warmupImages(Set<String> images, boolean pullMissing) {
        if (images == null || images.isEmpty()) {
            return;
        }

        for (String image : images) {
            if (image == null || image.isBlank()) {
                continue;
            }
            String normalized = image.trim();
            try {
                if (isImagePresentLocally(normalized)) {
                    warmedImages.add(normalized);
                    continue;
                }
                if (!pullMissing) {
                    continue;
                }
                dockerClient.pullImageCmd(normalized).exec(new PullImageResultCallback()).awaitCompletion();
                warmedImages.add(normalized);
            } catch (Exception ex) {
                log.warn("Judge warmup failed for image {}: {}", normalized, ex.getMessage());
            }
        }
    }

    public List<SubmissionResult> executeBatch(SubmissionRequest req, List<String> stdins) throws Exception {
        if (!batchModeEnabled || stdins == null || stdins.size() <= 1) {
            if (stdins == null || stdins.isEmpty()) {
                return List.of(execute(req));
            }
            java.util.ArrayList<SubmissionResult> fallback = new java.util.ArrayList<>(stdins.size());
            for (String stdin : stdins) {
                SubmissionRequest copy = new SubmissionRequest();
                copy.setLanguage(req.getLanguage());
                copy.setCode(req.getCode());
                copy.setProblemId(req.getProblemId());
                copy.setQueueLane(req.getQueueLane());
                copy.setStdin(stdin);
                copy.setTimeLimitSeconds(req.getTimeLimitSeconds());
                copy.setMemoryMb(req.getMemoryMb());
                copy.setCpus(req.getCpus());
                fallback.add(execute(copy));
            }
            return fallback;
        }

        String lang = req.getLanguage() == null ? "java" : req.getLanguage().toLowerCase();
        String normalizedLanguageKey = normalizeLanguageKey(lang);
        Semaphore languageSemaphore = languageSemaphores.getOrDefault(normalizedLanguageKey, languageSemaphores.get("java"));
        long waitTimeoutMs = Math.max(200L, executionQueueWaitTimeoutMs);
        boolean globalAcquired = globalExecutionSemaphore.tryAcquire(waitTimeoutMs, TimeUnit.MILLISECONDS);
        if (!globalAcquired) {
            throw new IllegalStateException("Judge execution saturated (global concurrency limit reached).");
        }

        boolean languageAcquired = false;
        try {
            languageAcquired = languageSemaphore != null
                    && languageSemaphore.tryAcquire(waitTimeoutMs, TimeUnit.MILLISECONDS);
            if (!languageAcquired) {
                throw new IllegalStateException("Judge execution saturated for language lane: " + normalizedLanguageKey);
            }

            String image = IMAGE_BY_LANG.getOrDefault(lang, "eclipse-temurin:17-jdk");
            int timeLimitSeconds = normalizePositiveInt(req.getTimeLimitSeconds(), DEFAULT_TIME_LIMIT_SECONDS);
            int memoryMb = normalizePositiveInt(req.getMemoryMb(), DEFAULT_MEMORY_MB);
            double cpus = normalizePositiveDouble(req.getCpus(), DEFAULT_CPUS);

            Path workspace = Files.createTempDirectory("judge-batch-" + UUID.randomUUID());
            try {
                Path srcFile;
                String compileCmdWorkspace = "";
                String execCmdWorkspace = "";
                String compileCmdWorker = "";
                String execCmdWorker = "";

                switch (lang) {
                    case "python":
                    case "py":
                        srcFile = workspace.resolve("Main.py");
                        Files.writeString(srcFile, req.getCode(), StandardCharsets.UTF_8);
                        execCmdWorkspace = "python3 Main.py";
                        execCmdWorker = "python3 Main.py";
                        break;
                    case "node":
                    case "js":
                    case "javascript":
                        srcFile = workspace.resolve("index.js");
                        Files.writeString(srcFile, req.getCode(), StandardCharsets.UTF_8);
                        execCmdWorkspace = "node index.js";
                        execCmdWorker = "node index.js";
                        break;
                    case "c":
                    case "cpp":
                    case "c++":
                        srcFile = workspace.resolve("main.cpp");
                        Files.writeString(srcFile, req.getCode(), StandardCharsets.UTF_8);
                        compileCmdWorkspace = "g++ main.cpp -std=c++17 -O2 -o /workspace/a.out";
                        execCmdWorkspace = "/workspace/a.out";
                        compileCmdWorker = "g++ main.cpp -std=c++17 -O2 -o a.out";
                        execCmdWorker = "./a.out";
                        break;
                    default:
                        srcFile = workspace.resolve("Main.java");
                        Files.writeString(srcFile, req.getCode(), StandardCharsets.UTF_8);
                        compileCmdWorkspace = "javac -d /workspace Main.java";
                        execCmdWorkspace = "java -cp /workspace Main";
                        compileCmdWorker = "javac -d . Main.java";
                        execCmdWorker = "java -cp . Main";
                        break;
                }

                setPosixPermissionsIfSupported(workspace, PosixFilePermissions.fromString("rwxr-xr-x"));
                setPosixPermissionsIfSupported(srcFile, PosixFilePermissions.fromString("rw-r--r--"));

                for (int index = 0; index < stdins.size(); index++) {
                    Path stdinPath = workspace.resolve("stdin-" + index + ".txt");
                    Files.writeString(stdinPath, stdins.get(index) == null ? "" : stdins.get(index), StandardCharsets.UTF_8);
                    setPosixPermissionsIfSupported(stdinPath, PosixFilePermissions.fromString("rw-r--r--"));
                }

                ensureImageAvailability(image);

                if (workerPoolEnabled) {
                    WorkerContainer worker = borrowWorkerContainer(
                            normalizedLanguageKey,
                            image,
                            memoryMb,
                            cpus,
                            waitTimeoutMs);
                    if (worker != null) {
                        try {
                            return executeBatchInWorkerContainer(
                                    worker,
                                    workspace,
                                    compileCmdWorker,
                                    execCmdWorker,
                                    stdins,
                                    timeLimitSeconds);
                        } finally {
                            releaseWorkerContainer(worker);
                        }
                    }
                }

                HostConfig hostConfig = HostConfig.newHostConfig()
                        .withMemory((long) memoryMb * 1024 * 1024)
                        .withTmpFs(Map.of(
                                "/workspace", "rw,exec,nosuid,size=64m",
                                "/tmp", "rw,exec,nosuid,size=64m",
                                "/var/tmp", "rw,noexec,nosuid,size=32m"))
                        .withCapDrop(
                                Capability.NET_RAW,
                                Capability.SYS_ADMIN,
                                Capability.NET_ADMIN)
                        .withNetworkMode("none");

                long cpuPeriod = 100_000L;
                long cpuQuota = (long) (cpus * cpuPeriod);
                hostConfig.withCpuPeriod(cpuPeriod).withCpuQuota(cpuQuota);
                hostConfig.withUlimits(new Ulimit[] {
                        new Ulimit("nofile", 256L, 256L),
                        new Ulimit("nproc", 64L, 64L)
                });

                String seccompProfile = System.getenv("JUDGE_SECCOMP_PROFILE");
                if (seccompProfile != null && !seccompProfile.isBlank()) {
                    hostConfig.withSecurityOpts(Collections.singletonList("seccomp=" + seccompProfile));
                }

                String containerName = "judge-batch-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
                CreateContainerResponse container = dockerClient.createContainerCmd(image)
                        .withName(containerName)
                        .withUser("1000:1000")
                        .withCmd("/bin/sh", "-c", "sleep infinity")
                        .withHostConfig(hostConfig)
                        .exec();

                String containerId = container.getId();
                try {
                    try (InputStream archiveStream = createWorkspaceArchive(workspace)) {
                        dockerClient.copyArchiveToContainerCmd(containerId)
                                .withRemotePath("/workspace")
                                .withTarInputStream(archiveStream)
                                .exec();
                    }

                    dockerClient.startContainerCmd(containerId).exec();

                    if (!compileCmdWorkspace.isEmpty()) {
                        ExecRunOutcome compileResult = executeInContainer(containerId, "cd /workspace && " + compileCmdWorkspace,
                                Math.max(3, timeLimitSeconds * 2));
                        if (compileResult.timedOut) {
                            return buildBatchFailure(stdins.size(), "TIME_LIMIT", compileResult.stderr, -1);
                        }
                        if (compileResult.exitCode != 0) {
                            String message = compileResult.stderr == null || compileResult.stderr.isBlank()
                                    ? compileResult.stdout
                                    : compileResult.stderr;
                            return buildBatchFailure(stdins.size(), "COMPILE_ERROR", message, COMPILE_ERROR_EXIT_CODE);
                        }
                    }

                    java.util.ArrayList<SubmissionResult> results = new java.util.ArrayList<>(stdins.size());
                    for (int index = 0; index < stdins.size(); index++) {
                        String command = "cd /workspace && cat stdin-" + index + ".txt | " + execCmdWorkspace;
                        long started = System.nanoTime();
                        ExecRunOutcome runResult = executeInContainer(containerId, command, timeLimitSeconds);
                        double runtimeSeconds = (System.nanoTime() - started) / 1_000_000_000.0;

                        SubmissionResult result = new SubmissionResult();
                        result.setStdout(runResult.stdout == null ? "" : runResult.stdout);
                        result.setStderr(runResult.stderr == null ? "" : runResult.stderr);
                        result.setRuntimeSeconds(runtimeSeconds);
                        result.setPeakMemoryBytes(0L);

                        if (runResult.timedOut) {
                            result.setExitCode(-1);
                            result.setStatus("TIME_LIMIT");
                        } else {
                            result.setExitCode(runResult.exitCode);
                            if (runResult.exitCode == 0) {
                                result.setStatus("ACCEPTED");
                            } else {
                                result.setStatus("RUNTIME_ERROR");
                            }
                        }
                        results.add(result);
                    }
                    return results;
                } finally {
                    try {
                        dockerClient.removeContainerCmd(containerId).withForce(true).exec();
                    } catch (Exception e) {
                        log.warn("Failed to remove batch container {}", containerId, e);
                    }
                }
            } finally {
                try (Stream<Path> walk = Files.walk(workspace)) {
                    walk.sorted(Comparator.reverseOrder())
                            .map(Path::toFile)
                            .forEach(file -> {
                                if (!file.delete()) {
                                    file.deleteOnExit();
                                }
                            });
                } catch (IOException e) {
                    log.warn("Failed to cleanup batch workspace", e);
                }
            }
        } finally {
            if (languageAcquired && languageSemaphore != null) {
                languageSemaphore.release();
            }
            globalExecutionSemaphore.release();
        }
    }

    private List<SubmissionResult> buildBatchFailure(int count, String status, String message, int exitCode) {
        java.util.ArrayList<SubmissionResult> failures = new java.util.ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            SubmissionResult failure = new SubmissionResult();
            failure.setStdout("");
            failure.setStderr(message == null ? "" : message);
            failure.setExitCode(exitCode);
            failure.setRuntimeSeconds(0.0);
            failure.setPeakMemoryBytes(0L);
            failure.setStatus(status);
            failures.add(failure);
        }
        return failures;
    }

    private void initializeWorkerPool() {
        shutdownWorkerPool();
        workerPools.clear();
        workerCounts.clear();
        if (!workerPoolEnabled) {
            return;
        }

        for (String languageKey : List.of("java", "python", "cpp", "node")) {
            workerPools.put(languageKey, new LinkedBlockingQueue<>());
            workerCounts.put(languageKey, new AtomicInteger(0));
            int warmCount = Math.min(Math.max(0, workerPoolInitialSize), resolveWorkerPoolMaxForLanguage(languageKey));
            if (warmCount <= 0) {
                continue;
            }
            String image = IMAGE_BY_LANG.getOrDefault(languageKey, IMAGE_BY_LANG.get("java"));
            for (int i = 0; i < warmCount; i++) {
                try {
                    WorkerContainer worker = createWorkerContainer(languageKey, image, DEFAULT_MEMORY_MB, DEFAULT_CPUS);
                    if (worker != null) {
                        workerPools.get(languageKey).offer(worker);
                        workerCounts.get(languageKey).incrementAndGet();
                    }
                } catch (Exception ex) {
                    log.warn("Worker warmup failed for language {}: {}", languageKey, ex.getMessage());
                }
            }
        }
    }

    private void shutdownWorkerPool() {
        if (managedWorkerContainerIds.isEmpty()) {
            return;
        }
        for (String containerId : Set.copyOf(managedWorkerContainerIds)) {
            try {
                dockerClient.removeContainerCmd(containerId).withForce(true).exec();
            } catch (Exception ignored) {
                // Best effort cleanup during shutdown.
            } finally {
                managedWorkerContainerIds.remove(containerId);
            }
        }
        workerPools.clear();
        workerCounts.clear();
    }

    private WorkerContainer borrowWorkerContainer(
            String languageKey,
            String image,
            int memoryMb,
            double cpus,
            long waitTimeoutMs) {
        if (!workerPoolEnabled) {
            return null;
        }

        String normalizedLanguage = normalizeLanguageKey(languageKey);
        BlockingQueue<WorkerContainer> pool = workerPools.computeIfAbsent(normalizedLanguage, key -> new LinkedBlockingQueue<>());
        workerCounts.computeIfAbsent(normalizedLanguage, key -> new AtomicInteger(0));

        WorkerContainer warmWorker;
        while ((warmWorker = pool.poll()) != null) {
            if (isWorkerHealthy(warmWorker)) {
                return warmWorker;
            }
            retireWorkerContainer(warmWorker);
        }

        WorkerContainer created = tryCreateWorkerContainer(normalizedLanguage, image, memoryMb, cpus);
        if (created != null) {
            return created;
        }

        try {
            WorkerContainer waited = pool.poll(Math.max(200L, waitTimeoutMs), TimeUnit.MILLISECONDS);
            if (waited == null) {
                return null;
            }
            if (isWorkerHealthy(waited)) {
                return waited;
            }
            retireWorkerContainer(waited);
            return null;
        } catch (InterruptedException interruptedException) {
            Thread.currentThread().interrupt();
            return null;
        }
    }

    private WorkerContainer tryCreateWorkerContainer(String languageKey, String image, int memoryMb, double cpus) {
        AtomicInteger counter = workerCounts.computeIfAbsent(languageKey, key -> new AtomicInteger(0));
        int maxWorkers = resolveWorkerPoolMaxForLanguage(languageKey);
        while (true) {
            int current = counter.get();
            if (current >= maxWorkers) {
                return null;
            }
            if (counter.compareAndSet(current, current + 1)) {
                break;
            }
        }

        try {
            WorkerContainer created = createWorkerContainer(languageKey, image, memoryMb, cpus);
            if (created == null) {
                counter.decrementAndGet();
            }
            return created;
        } catch (Exception ex) {
            counter.decrementAndGet();
            log.warn("Failed to create worker container for {}: {}", languageKey, ex.getMessage());
            return null;
        }
    }

    private WorkerContainer createWorkerContainer(String languageKey, String image, int memoryMb, double cpus) throws Exception {
        ensureImageAvailability(image);
        HostConfig hostConfig = buildHostConfig(memoryMb, cpus);
        String containerName = "judge-worker-" + languageKey + "-"
                + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        CreateContainerResponse container = dockerClient.createContainerCmd(image)
                .withName(containerName)
                .withUser("1000:1000")
                .withCmd("/bin/sh", "-lc", "mkdir -p /workspace/jobs && sleep infinity")
                .withHostConfig(hostConfig)
                .exec();
        dockerClient.startContainerCmd(container.getId()).exec();
        managedWorkerContainerIds.add(container.getId());
        return new WorkerContainer(container.getId(), languageKey, image);
    }

    private void releaseWorkerContainer(WorkerContainer worker) {
        if (worker == null) {
            return;
        }
        if (!workerPoolEnabled) {
            retireWorkerContainer(worker);
            return;
        }

        if (!isWorkerHealthy(worker)) {
            retireWorkerContainer(worker);
            return;
        }
        BlockingQueue<WorkerContainer> pool = workerPools.computeIfAbsent(worker.languageKey, key -> new LinkedBlockingQueue<>());
        pool.offer(worker);
    }

    private void retireWorkerContainer(WorkerContainer worker) {
        if (worker == null || worker.containerId == null || worker.containerId.isBlank()) {
            return;
        }
        try {
            dockerClient.removeContainerCmd(worker.containerId).withForce(true).exec();
        } catch (Exception ignored) {
            // Best effort container retirement.
        } finally {
            managedWorkerContainerIds.remove(worker.containerId);
            AtomicInteger counter = workerCounts.get(worker.languageKey);
            if (counter != null) {
                counter.updateAndGet(current -> Math.max(0, current - 1));
            }
        }
    }

    private boolean isWorkerHealthy(WorkerContainer worker) {
        if (worker == null || worker.containerId == null || worker.containerId.isBlank()) {
            return false;
        }
        try {
            InspectContainerResponse inspect = dockerClient.inspectContainerCmd(worker.containerId).exec();
            return inspect != null
                    && inspect.getState() != null
                    && Boolean.TRUE.equals(inspect.getState().getRunning());
        } catch (Exception ex) {
            return false;
        }
    }

    private HostConfig buildHostConfig(int memoryMb, double cpus) {
        HostConfig hostConfig = HostConfig.newHostConfig()
                .withMemory((long) memoryMb * 1024 * 1024)
                .withTmpFs(Map.of(
                        "/workspace", "rw,exec,nosuid,size=64m",
                        "/tmp", "rw,exec,nosuid,size=64m",
                        "/var/tmp", "rw,noexec,nosuid,size=32m"))
                .withCapDrop(
                        Capability.NET_RAW,
                        Capability.SYS_ADMIN,
                        Capability.NET_ADMIN)
                .withNetworkMode("none");

        long cpuPeriod = 100_000L;
        long cpuQuota = (long) (cpus * cpuPeriod);
        hostConfig.withCpuPeriod(cpuPeriod).withCpuQuota(cpuQuota);
        hostConfig.withUlimits(new Ulimit[] {
                new Ulimit("nofile", 256L, 256L),
                new Ulimit("nproc", 64L, 64L)
        });

        String seccompProfile = System.getenv("JUDGE_SECCOMP_PROFILE");
        if (seccompProfile != null && !seccompProfile.isBlank()) {
            hostConfig.withSecurityOpts(Collections.singletonList("seccomp=" + seccompProfile));
        }
        return hostConfig;
    }

    private int resolveWorkerPoolMaxForLanguage(String languageKey) {
        int laneLimit = resolveLanguageLimit(languageKey);
        if (workerPoolMaxPerLanguage <= 0) {
            return laneLimit;
        }
        return Math.max(1, Math.min(workerPoolMaxPerLanguage, laneLimit));
    }

    private int resolveLanguageLimit(String languageKey) {
        return switch (normalizeLanguageKey(languageKey)) {
            case "python" -> Math.max(1, languageLimitPython);
            case "cpp" -> Math.max(1, languageLimitCpp);
            case "node" -> Math.max(1, languageLimitNode);
            default -> Math.max(1, languageLimitJava);
        };
    }

    private List<SubmissionResult> executeBatchInWorkerContainer(
            WorkerContainer worker,
            Path workspace,
            String compileCmd,
            String execCmd,
            List<String> stdins,
            int timeLimitSeconds) throws Exception {
        String jobName = "job-" + UUID.randomUUID().toString().replace("-", "");
        String jobDir = "/workspace/jobs/" + jobName;
        ExecRunOutcome mkdirOutcome = executeInContainer(worker.containerId, "mkdir -p /workspace/jobs", 3);
        if (mkdirOutcome.timedOut || mkdirOutcome.exitCode != 0) {
            String message = mkdirOutcome.stderr == null || mkdirOutcome.stderr.isBlank()
                    ? mkdirOutcome.stdout
                    : mkdirOutcome.stderr;
            throw new IllegalStateException("Unable to initialize worker job directory: " + message);
        }

        try {
            try (InputStream archiveStream = createWorkspaceArchive(workspace, jobName)) {
                dockerClient.copyArchiveToContainerCmd(worker.containerId)
                        .withRemotePath("/workspace/jobs")
                        .withTarInputStream(archiveStream)
                        .exec();
            }

            if (!compileCmd.isEmpty()) {
                ExecRunOutcome compileResult = executeInContainer(
                        worker.containerId,
                        "cd " + jobDir + " && " + compileCmd,
                        Math.max(3, timeLimitSeconds * 2));
                if (compileResult.timedOut) {
                    return buildBatchFailure(stdins.size(), "TIME_LIMIT", compileResult.stderr, -1);
                }
                if (compileResult.exitCode != 0) {
                    String message = compileResult.stderr == null || compileResult.stderr.isBlank()
                            ? compileResult.stdout
                            : compileResult.stderr;
                    return buildBatchFailure(stdins.size(), "COMPILE_ERROR", message, COMPILE_ERROR_EXIT_CODE);
                }
            }

            java.util.ArrayList<SubmissionResult> results = new java.util.ArrayList<>(stdins.size());
            for (int index = 0; index < stdins.size(); index++) {
                String command = "cd " + jobDir + " && cat stdin-" + index + ".txt | " + execCmd;
                long started = System.nanoTime();
                ExecRunOutcome runResult = executeInContainer(worker.containerId, command, timeLimitSeconds);
                double runtimeSeconds = (System.nanoTime() - started) / 1_000_000_000.0;

                SubmissionResult result = new SubmissionResult();
                result.setStdout(runResult.stdout == null ? "" : runResult.stdout);
                result.setStderr(runResult.stderr == null ? "" : runResult.stderr);
                result.setRuntimeSeconds(runtimeSeconds);
                result.setPeakMemoryBytes(0L);

                if (runResult.timedOut) {
                    result.setExitCode(-1);
                    result.setStatus("TIME_LIMIT");
                } else {
                    result.setExitCode(runResult.exitCode);
                    result.setStatus(runResult.exitCode == 0 ? "ACCEPTED" : "RUNTIME_ERROR");
                }
                results.add(result);
            }
            return results;
        } finally {
            try {
                executeInContainer(worker.containerId, "rm -rf " + jobDir, 3);
            } catch (Exception cleanupEx) {
                log.debug("Failed to cleanup worker job directory {}", jobDir, cleanupEx);
            }
        }
    }

    private SubmissionResult executeSingleInWorkerContainer(
            WorkerContainer worker,
            Path workspace,
            String compileCmd,
            String execCmd,
            boolean hasStdin,
            int timeLimitSeconds) throws Exception {
        String jobName = "job-" + UUID.randomUUID().toString().replace("-", "");
        String jobDir = "/workspace/jobs/" + jobName;
        ExecRunOutcome mkdirOutcome = executeInContainer(worker.containerId, "mkdir -p /workspace/jobs", 3);
        if (mkdirOutcome.timedOut || mkdirOutcome.exitCode != 0) {
            String message = mkdirOutcome.stderr == null || mkdirOutcome.stderr.isBlank()
                    ? mkdirOutcome.stdout
                    : mkdirOutcome.stderr;
            throw new IllegalStateException("Unable to initialize worker job directory: " + message);
        }

        try {
            try (InputStream archiveStream = createWorkspaceArchive(workspace, jobName)) {
                dockerClient.copyArchiveToContainerCmd(worker.containerId)
                        .withRemotePath("/workspace/jobs")
                        .withTarInputStream(archiveStream)
                        .exec();
            }

            if (!compileCmd.isEmpty()) {
                ExecRunOutcome compileResult = executeInContainer(
                        worker.containerId,
                        "cd " + jobDir + " && " + compileCmd,
                        Math.max(3, timeLimitSeconds * 2));
                if (compileResult.timedOut) {
                    return buildSingleFailure("TIME_LIMIT", compileResult.stderr, -1);
                }
                if (compileResult.exitCode != 0) {
                    String message = compileResult.stderr == null || compileResult.stderr.isBlank()
                            ? compileResult.stdout
                            : compileResult.stderr;
                    return buildSingleFailure("COMPILE_ERROR", message, COMPILE_ERROR_EXIT_CODE);
                }
            }

            String command = hasStdin
                    ? "cd " + jobDir + " && cat stdin.txt | " + execCmd
                    : "cd " + jobDir + " && " + execCmd;
            long started = System.nanoTime();
            ExecRunOutcome runResult = executeInContainer(worker.containerId, command, timeLimitSeconds);
            double runtimeSeconds = (System.nanoTime() - started) / 1_000_000_000.0;

            SubmissionResult result = new SubmissionResult();
            result.setStdout(runResult.stdout == null ? "" : runResult.stdout);
            result.setStderr(runResult.stderr == null ? "" : runResult.stderr);
            result.setRuntimeSeconds(runtimeSeconds);
            result.setPeakMemoryBytes(0L);
            if (runResult.timedOut) {
                result.setExitCode(-1);
                result.setStatus("TIME_LIMIT");
            } else {
                result.setExitCode(runResult.exitCode);
                if (runResult.exitCode == 0) {
                    result.setStatus("ACCEPTED");
                } else if (runResult.exitCode == COMPILE_ERROR_EXIT_CODE) {
                    result.setStatus("COMPILE_ERROR");
                } else {
                    result.setStatus("RUNTIME_ERROR");
                }
            }
            return result;
        } finally {
            try {
                executeInContainer(worker.containerId, "rm -rf " + jobDir, 3);
            } catch (Exception cleanupEx) {
                log.debug("Failed to cleanup worker job directory {}", jobDir, cleanupEx);
            }
        }
    }

    private SubmissionResult buildSingleFailure(String status, String stderr, int exitCode) {
        SubmissionResult result = new SubmissionResult();
        result.setStdout("");
        result.setStderr(stderr == null ? "" : stderr);
        result.setExitCode(exitCode);
        result.setRuntimeSeconds(0.0);
        result.setPeakMemoryBytes(0L);
        result.setStatus(status);
        return result;
    }

    private static final class WorkerContainer {
        private final String containerId;
        private final String languageKey;
        private final String image;

        private WorkerContainer(String containerId, String languageKey, String image) {
            this.containerId = containerId;
            this.languageKey = languageKey;
            this.image = image;
        }
    }

    private static final class ExecRunOutcome {
        private final boolean completed;
        private final boolean timedOut;
        private final int exitCode;
        private final String stdout;
        private final String stderr;

        private ExecRunOutcome(boolean completed, boolean timedOut, int exitCode, String stdout, String stderr) {
            this.completed = completed;
            this.timedOut = timedOut;
            this.exitCode = exitCode;
            this.stdout = stdout;
            this.stderr = stderr;
        }
    }

    private ExecRunOutcome executeInContainer(String containerId, String command, int timeoutSeconds) throws Exception {
        ExecCreateCmdResponse exec = dockerClient.execCreateCmd(containerId)
                .withAttachStdout(true)
                .withAttachStderr(true)
                .withCmd("/bin/sh", "-lc", command)
                .exec();

        LogCollector collector = new LogCollector();
        var callback = dockerClient.execStartCmd(exec.getId()).exec(collector);
        boolean finished = callback.awaitCompletion(Math.max(1, timeoutSeconds), TimeUnit.SECONDS);
        if (!finished) {
            callback.close();
            return new ExecRunOutcome(false, true, -1, collector.getStdout(), collector.getStderr());
        }

        Integer exitCode = 0;
        try {
            var inspect = dockerClient.inspectExecCmd(exec.getId()).exec();
            exitCode = inspect != null && inspect.getExitCode() != null ? inspect.getExitCode() : 0;
        } catch (Exception ignored) {
            exitCode = 0;
        }

        return new ExecRunOutcome(true, false, exitCode, collector.getStdout(), collector.getStderr());
    }

    public SubmissionResult execute(SubmissionRequest req) throws Exception {
        String lang = req.getLanguage() == null ? "java" : req.getLanguage().toLowerCase();
        String normalizedLanguageKey = normalizeLanguageKey(lang);
        Semaphore languageSemaphore = languageSemaphores.getOrDefault(normalizedLanguageKey, languageSemaphores.get("java"));
        long waitTimeoutMs = Math.max(200L, executionQueueWaitTimeoutMs);
        boolean globalAcquired = globalExecutionSemaphore.tryAcquire(waitTimeoutMs, TimeUnit.MILLISECONDS);
        if (!globalAcquired) {
            throw new IllegalStateException("Judge execution saturated (global concurrency limit reached).");
        }

        boolean languageAcquired = false;
        try {
            languageAcquired = languageSemaphore != null
                    && languageSemaphore.tryAcquire(waitTimeoutMs, TimeUnit.MILLISECONDS);
            if (!languageAcquired) {
                throw new IllegalStateException("Judge execution saturated for language lane: " + normalizedLanguageKey);
            }

        String image = IMAGE_BY_LANG.getOrDefault(lang, "eclipse-temurin:17-jdk");
        int timeLimitSeconds = normalizePositiveInt(req.getTimeLimitSeconds(), DEFAULT_TIME_LIMIT_SECONDS);
        int memoryMb = normalizePositiveInt(req.getMemoryMb(), DEFAULT_MEMORY_MB);
        double cpus = normalizePositiveDouble(req.getCpus(), DEFAULT_CPUS);

        Path workspace = Files.createTempDirectory("judge-" + UUID.randomUUID());
        try {
            Path srcFile;
            String compileCmd = "";
            String execCmd = "";
            String compileCmdWorker = "";
            String execCmdWorker = "";

            switch (lang) {
                case "python":
                case "py":
                    srcFile = workspace.resolve("Main.py");
                    Files.writeString(srcFile, req.getCode(), StandardCharsets.UTF_8);
                    execCmd = "python3 Main.py";
                    execCmdWorker = "python3 Main.py";
                    break;
                case "node":
                case "js":
                case "javascript":
                    srcFile = workspace.resolve("index.js");
                    Files.writeString(srcFile, req.getCode(), StandardCharsets.UTF_8);
                    execCmd = "node index.js";
                    execCmdWorker = "node index.js";
                    break;
                case "c":
                case "cpp":
                case "c++":
                    srcFile = workspace.resolve("main.cpp");
                    Files.writeString(srcFile, req.getCode(), StandardCharsets.UTF_8);
                    compileCmd = "g++ main.cpp -std=c++17 -O2 -o /workspace/a.out";
                    execCmd = "/workspace/a.out";
                    compileCmdWorker = "g++ main.cpp -std=c++17 -O2 -o a.out";
                    execCmdWorker = "./a.out";
                    break;
                default:
                    srcFile = workspace.resolve("Main.java");
                    Files.writeString(srcFile, req.getCode(), StandardCharsets.UTF_8);
                    compileCmd = "javac -d /workspace Main.java";
                    execCmd = "java -cp /workspace Main";
                    compileCmdWorker = "javac -d . Main.java";
                    execCmdWorker = "java -cp . Main";
                    break;
            }

            setPosixPermissionsIfSupported(workspace, PosixFilePermissions.fromString("rwxr-xr-x"));
            setPosixPermissionsIfSupported(srcFile, PosixFilePermissions.fromString("rw-r--r--"));

            boolean hasStdin = req.getStdin() != null && !req.getStdin().isEmpty();
            if (hasStdin) {
                Path stdinPath = workspace.resolve("stdin.txt");
                Files.writeString(stdinPath, req.getStdin(), StandardCharsets.UTF_8);
                setPosixPermissionsIfSupported(stdinPath, PosixFilePermissions.fromString("rw-r--r--"));
            }

            if (workerPoolEnabled) {
                WorkerContainer worker = borrowWorkerContainer(
                        normalizedLanguageKey,
                        image,
                        memoryMb,
                        cpus,
                        waitTimeoutMs);
                if (worker != null) {
                    try {
                        return executeSingleInWorkerContainer(
                                worker,
                                workspace,
                                compileCmdWorker,
                                execCmdWorker,
                                hasStdin,
                                timeLimitSeconds);
                    } finally {
                        releaseWorkerContainer(worker);
                    }
                }
            }

            StringBuilder scriptBuilder = new StringBuilder();
            scriptBuilder.append("#!/bin/sh\ncd /\n");
            if (!compileCmd.isEmpty()) {
                scriptBuilder.append("if ! ").append(compileCmd).append("; then exit ")
                        .append(COMPILE_ERROR_EXIT_CODE).append("; fi\n");
            }
            if (hasStdin) {
                scriptBuilder.append("cat stdin.txt | ").append(execCmd).append("\n");
            } else {
                scriptBuilder.append(execCmd).append("\n");
            }
            Path runScript = workspace.resolve("run.sh");
            Files.writeString(runScript, scriptBuilder.toString(), StandardCharsets.UTF_8);
            setPosixPermissionsIfSupported(runScript, PosixFilePermissions.fromString("rwxr-xr-x"));

            ensureImageAvailability(image);

            HostConfig hostConfig = HostConfig.newHostConfig()
                    .withMemory((long) memoryMb * 1024 * 1024)
                    .withTmpFs(Map.of(
                            "/workspace", "rw,exec,nosuid,size=64m",
                            "/tmp", "rw,exec,nosuid,size=64m",
                            "/var/tmp", "rw,noexec,nosuid,size=32m"))
                    .withCapDrop(
                            Capability.NET_RAW,
                            Capability.SYS_ADMIN,
                            Capability.NET_ADMIN)
                    .withNetworkMode("none");

            long cpuPeriod = 100_000L;
            long cpuQuota = (long) (cpus * cpuPeriod);
            hostConfig.withCpuPeriod(cpuPeriod).withCpuQuota(cpuQuota);
            hostConfig.withUlimits(new Ulimit[] {
                    new Ulimit("nofile", 256L, 256L),
                    new Ulimit("nproc", 64L, 64L)
            });

            String seccompProfile = System.getenv("JUDGE_SECCOMP_PROFILE");
            if (seccompProfile != null && !seccompProfile.isBlank()) {
                hostConfig.withSecurityOpts(Collections.singletonList("seccomp=" + seccompProfile));
            }

            String containerName = "judge-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
            CreateContainerResponse container = dockerClient.createContainerCmd(image)
                    .withName(containerName)
                    .withUser("1000:1000")
                    .withCmd("/bin/sh", "-c", "cd / && /bin/sh run.sh")
                    .withHostConfig(hostConfig)
                    .exec();

            String containerId = container.getId();
            try (InputStream archiveStream = createWorkspaceArchive(workspace)) {
                dockerClient.copyArchiveToContainerCmd(containerId)
                        .withRemotePath("/")
                        .withTarInputStream(archiveStream)
                        .exec();
            }

            long startNano = System.nanoTime();
            dockerClient.startContainerCmd(containerId).exec();

            StatsCollector statsCollector = new StatsCollector();
            dockerClient.statsCmd(containerId).exec(statsCollector);

            Future<Integer> waitFuture = waitExecutor.submit(() -> {
                InspectContainerResponse inspect;
                while (true) {
                    inspect = dockerClient.inspectContainerCmd(containerId).exec();
                    if (!inspect.getState().getRunning()) {
                        Integer exit = inspect.getState().getExitCode();
                        return exit == null ? 0 : exit;
                    }
                    Thread.sleep(100);
                }
            });

            int exitCode;
            try {
                exitCode = waitFuture.get(timeLimitSeconds, TimeUnit.SECONDS);
            } catch (TimeoutException te) {
                dockerClient.killContainerCmd(containerId).exec();
                exitCode = -1;
            }

            long endNano = System.nanoTime();
            double runtimeSeconds = (endNano - startNano) / 1_000_000_000.0;

            long peakMemory = 0L;
            try {
                statsCollector.close();
                statsCollector.awaitCompletion();
                peakMemory = statsCollector.getPeakMemoryBytes();
            } catch (Exception ignored) {
                // no-op
            }

            LogCollector collector = new LogCollector();
            dockerClient.logContainerCmd(containerId)
                    .withStdErr(true)
                    .withStdOut(true)
                    .withTailAll()
                    .exec(collector)
                    .awaitCompletion();

            String stdout = collector.getStdout();
            String stderr = collector.getStderr();

            try {
                dockerClient.removeContainerCmd(containerId).withForce(true).exec();
            } catch (Exception e) {
                log.warn("Failed to remove container {}", containerId, e);
            }

            SubmissionResult result = new SubmissionResult();
            result.setStdout(stdout == null ? "" : stdout);
            result.setStderr(stderr == null ? "" : stderr);
            result.setExitCode(exitCode);
            result.setRuntimeSeconds(runtimeSeconds);
            result.setPeakMemoryBytes(peakMemory);
            if (exitCode == 0) {
                result.setStatus("ACCEPTED");
            } else if (exitCode == -1) {
                result.setStatus("TIME_LIMIT");
            } else if (exitCode == COMPILE_ERROR_EXIT_CODE) {
                result.setStatus("COMPILE_ERROR");
            } else {
                result.setStatus("RUNTIME_ERROR");
            }
            return result;
        } finally {
            try (Stream<Path> walk = Files.walk(workspace)) {
                walk.sorted(Comparator.reverseOrder())
                        .map(Path::toFile)
                        .forEach(file -> {
                            if (!file.delete()) {
                                file.deleteOnExit();
                            }
                        });
            } catch (IOException e) {
                log.warn("Failed to cleanup workspace", e);
            }
        }
        } finally {
            if (languageAcquired && languageSemaphore != null) {
                languageSemaphore.release();
            }
            globalExecutionSemaphore.release();
        }
    }

    private int normalizePositiveInt(Integer value, int fallback) {
        if (value == null || value <= 0) {
            return fallback;
        }
        return value;
    }

    private double normalizePositiveDouble(Double value, double fallback) {
        if (value == null || value <= 0) {
            return fallback;
        }
        return value;
    }

    private void setPosixPermissionsIfSupported(Path path, Set<PosixFilePermission> permissions) {
        try {
            Files.setPosixFilePermissions(path, permissions);
        } catch (UnsupportedOperationException ignored) {
            // Non-POSIX file system (for example Windows local dev).
        } catch (IOException e) {
            log.debug("Unable to set permissions for {}", path, e);
        }
    }

    private InputStream createWorkspaceArchive(Path workspace) throws IOException {
        return createWorkspaceArchive(workspace, "");
    }

    private InputStream createWorkspaceArchive(Path workspace, String archivePrefix) throws IOException {
        String normalizedPrefix = archivePrefix == null || archivePrefix.isBlank()
                ? ""
                : archivePrefix.replace('\\', '/').replaceAll("/+$", "") + "/";
        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        try (TarArchiveOutputStream tarOutputStream = new TarArchiveOutputStream(byteArrayOutputStream);
                Stream<Path> paths = Files.walk(workspace)) {
            tarOutputStream.setLongFileMode(TarArchiveOutputStream.LONGFILE_POSIX);
            for (Path path : (Iterable<Path>) paths.filter(Files::isRegularFile)::iterator) {
                String relative = workspace.relativize(path).toString().replace('\\', '/');
                String entryName = normalizedPrefix + relative;
                TarArchiveEntry entry = new TarArchiveEntry(entryName);
                entry.setSize(Files.size(path));
                entry.setMode(relative.endsWith("run.sh") ? 0755 : 0644);
                tarOutputStream.putArchiveEntry(entry);
                Files.copy(path, tarOutputStream);
                tarOutputStream.closeArchiveEntry();
            }
            tarOutputStream.finish();
        }
        return new ByteArrayInputStream(byteArrayOutputStream.toByteArray());
    }

    private void ensureImageAvailability(String image) throws InterruptedException {
        if (!pullOnDemand) {
            return;
        }
        if (warmedImages.contains(image)) {
            return;
        }

        synchronized (warmedImages) {
            if (warmedImages.contains(image)) {
                return;
            }
            dockerClient.pullImageCmd(image).exec(new PullImageResultCallback()).awaitCompletion();
            warmedImages.add(image);
        }
    }

    private boolean isImagePresentLocally(String image) {
        try {
            dockerClient.inspectImageCmd(image).exec();
            return true;
        } catch (NotFoundException nf) {
            return false;
        } catch (Exception ex) {
            log.debug("Could not inspect local image {}: {}", image, ex.getMessage());
            return false;
        }
    }

    private String normalizeLanguageKey(String language) {
        if (language == null) {
            return "java";
        }
        String normalized = language.trim().toLowerCase();
        return switch (normalized) {
            case "py", "python" -> "python";
            case "c", "cpp", "c++" -> "cpp";
            case "js", "javascript", "node" -> "node";
            default -> "java";
        };
    }
}

class LogCollector extends com.github.dockerjava.api.async.ResultCallback.Adapter<com.github.dockerjava.api.model.Frame> {
    private final StringBuilder out = new StringBuilder();
    private final StringBuilder err = new StringBuilder();

    @Override
    public void onNext(com.github.dockerjava.api.model.Frame item) {
        if (item == null || item.getPayload() == null) {
            return;
        }
        String payload = new String(item.getPayload(), StandardCharsets.UTF_8);
        if (item.getStreamType() == com.github.dockerjava.api.model.StreamType.STDOUT) {
            out.append(payload);
        } else {
            err.append(payload);
        }
    }

    public String getStdout() {
        return out.toString();
    }

    public String getStderr() {
        return err.toString();
    }
}

class StatsCollector
        extends com.github.dockerjava.api.async.ResultCallback.Adapter<com.github.dockerjava.api.model.Statistics> {
    private volatile long peak = 0L;

    @Override
    public void onNext(com.github.dockerjava.api.model.Statistics stats) {
        if (stats == null) {
            return;
        }
        try {
            if (stats.getMemoryStats() != null && stats.getMemoryStats().getUsage() != null) {
                long usage = stats.getMemoryStats().getUsage();
                if (usage > peak) {
                    peak = usage;
                }
            }
        } catch (Throwable ignored) {
            // no-op
        }
    }

    public long getPeakMemoryBytes() {
        return peak;
    }
}
