package com.collegecontest.config;

import com.collegecontest.club.model.Club;
import com.collegecontest.club.model.ClubMember;
import com.collegecontest.club.model.ClubMemberRole;
import com.collegecontest.club.model.ClubVisibility;
import com.collegecontest.club.repository.ClubMemberRepository;
import com.collegecontest.club.repository.ClubRepository;
import com.collegecontest.model.Role;
import com.collegecontest.model.User;
import com.collegecontest.model.Contest;
import com.collegecontest.model.Option;
import com.collegecontest.model.Problem;
import com.collegecontest.model.Question;
import com.collegecontest.model.Quiz;
import com.collegecontest.repository.ContestRepository;
import com.collegecontest.repository.ProblemRepository;
import com.collegecontest.repository.QuizRepository;
import com.collegecontest.repository.UserRepository;
import com.collegecontest.service.UserPublicIdService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private ContestRepository contestRepository;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserPublicIdService userPublicIdService;

    @Autowired
    private ClubRepository clubRepository;

    @Autowired
    private ClubMemberRepository clubMemberRepository;

    @Value("${app.bootstrap-admin.enabled:false}")
    private boolean bootstrapAdminEnabled;

    @Value("${app.bootstrap-admin.admin-email:}")
    private String bootstrapAdminEmail;

    @Value("${app.bootstrap-admin.admin-password:}")
    private String bootstrapAdminPassword;

    @Value("${app.problem-set.seed-count:500}")
    private int coreProblemSetSeedCount;

    @Override
    public void run(String... args) throws Exception {
        // Ensure role column supports new roles (legacy DB may still use ENUM(STUDENT,ADMIN)).
        try {
            jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN role VARCHAR(32) NOT NULL");
        } catch (Exception e) {
            logger.debug("Role column migration skipped: {}", e.getMessage());
        }
        try {
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS public_user_id VARCHAR(16) NULL");
        } catch (Exception e) {
            logger.debug("public_user_id column migration skipped: {}", e.getMessage());
        }
        try {
            jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN avatar_url LONGTEXT NULL");
        } catch (Exception e) {
            logger.debug("avatar_url LONGTEXT migration skipped: {}", e.getMessage());
        }
        try {
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_last_used_at DATETIME NULL");
        } catch (Exception e) {
            logger.debug("ai_last_used_at column migration skipped: {}", e.getMessage());
        }
        try {
            jdbcTemplate.execute("ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS created_at DATETIME NULL");
        } catch (Exception e) {
            logger.debug("quizzes.created_at column migration skipped: {}", e.getMessage());
        }
        try {
            jdbcTemplate.execute("ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS updated_at DATETIME NULL");
        } catch (Exception e) {
            logger.debug("quizzes.updated_at column migration skipped: {}", e.getMessage());
        }
        try {
            jdbcTemplate.execute("UPDATE quizzes SET created_at = COALESCE(created_at, start_time, NOW()), updated_at = COALESCE(updated_at, created_at, NOW())");
        } catch (Exception e) {
            logger.debug("quizzes timestamp backfill skipped: {}", e.getMessage());
        }
        try {
            jdbcTemplate.execute("CREATE UNIQUE INDEX idx_users_public_user_id ON users(public_user_id)");
        } catch (Exception e) {
            logger.debug("public_user_id index migration skipped: {}", e.getMessage());
        }
        try {
            jdbcTemplate.execute("CREATE INDEX idx_users_ai_last_used_at ON users(ai_last_used_at)");
        } catch (Exception e) {
            logger.debug("ai_last_used_at index migration skipped: {}", e.getMessage());
        }
        try {
            jdbcTemplate.execute("CREATE INDEX idx_quizzes_created_at ON quizzes(created_at)");
        } catch (Exception e) {
            logger.debug("quizzes.created_at index migration skipped: {}", e.getMessage());
        }

        if (bootstrapAdminEnabled) {
            bootstrapPrivilegedUser(
                    bootstrapAdminEmail,
                    bootstrapAdminPassword,
                    "admin",
                    "Admin",
                    "Platform Admin",
                    Role.ADMIN);
        } else {
            logger.info("Privileged account bootstrap is disabled. Set app.bootstrap-admin.enabled=true to enable.");
        }

        // Backfill usernames and immutable public IDs for legacy users.
        userRepository.findAll().forEach(user -> {
            boolean shouldSave = false;
            if (user.getUsername() == null || user.getUsername().isBlank()) {
                String base = (user.getName() != null && !user.getName().isBlank()
                        ? user.getName()
                        : user.getEmail().split("@")[0])
                        .toLowerCase()
                        .replaceAll("[^a-z0-9]+", "");
                if (base.isBlank()) base = "user";
                String candidate = base;
                int i = 1;
                while (userRepository.existsByUsername(candidate)) {
                    candidate = base + i++;
                }
                user.setUsername(candidate);
                shouldSave = true;
            }
            if (user.getPublicUserId() == null || user.getPublicUserId().isBlank()) {
                userPublicIdService.ensurePublicUserId(user);
                shouldSave = true;
            }
            if (shouldSave) {
                userRepository.save(user);
            }
        });

        try {
            jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN public_user_id VARCHAR(16) NOT NULL");
        } catch (Exception e) {
            logger.debug("public_user_id NOT NULL migration skipped: {}", e.getMessage());
        }

        seedLongTermQuizzesAndContests();
    }

    private void seedLongTermQuizzesAndContests() {
        User owner = resolveSeedContentOwner();
        if (owner == null) {
            logger.warn("Skipping quiz/contest seed because no owner user is available.");
            return;
        }

        LocalDateTime startTime = LocalDateTime.now().minusDays(1);
        LocalDateTime endTime = LocalDateTime.now().plusYears(10);

        seedCBasicsQuiz(owner, startTime, endTime);
        seedCPointersQuiz(owner, startTime, endTime);
        seedCPracticeQuiz(owner, startTime, endTime);

        seedEasyCStarterContest(owner, startTime, endTime);
        seedCLoopsContest(owner, startTime, endTime);
        seedCStringContest(owner, startTime, endTime);
        seedCoreProblemSet(owner, startTime, endTime);
        seedClubs(owner);
    }

    private void seedClubs(User owner) {
        List<String[]> clubsToSeed = List.of(
                new String[]{"Algorithms Arena", "Weekly algorithm drills and peer problem solving sessions."},
                new String[]{"Backend Builders Club", "Spring Boot APIs, architecture, and scalable backend practice."},
                new String[]{"Bug Hunters Circle", "Debugging challenges, root-cause analysis, and fix walkthroughs."},
                new String[]{"C Language Starters", "Beginner-friendly C language practice with simple contests."},
                new String[]{"Code Review Guild", "Structured code review practice with clean coding standards."},
                new String[]{"Competitive Coding Squad", "Contest prep, topic plans, and mock coding rounds."},
                new String[]{"Database Design Lab", "SQL practice, schema design, indexing, and query optimization."},
                new String[]{"Data Structures Hub", "Hands-on DSA sessions focused on fundamentals and patterns."},
                new String[]{"Frontend UX Studio", "UI components, responsive design, and accessibility improvements."},
                new String[]{"Git and DevOps Group", "Version control workflows, Docker basics, and CI pipelines."},
                new String[]{"Interview Ready Club", "Interview prep with coding, CS theory, and communication rounds."},
                new String[]{"Java Masters Community", "Core Java, OOP, collections, and practical project snippets."},
                new String[]{"Placement Preparation Team", "Job-focused preparation plans and company-specific practice."},
                new String[]{"Problem Solvers Union", "Daily coding streak challenges and collaborative solving."},
                new String[]{"Project Builders Network", "Build-and-ship projects with mentorship and review checkpoints."},
                new String[]{"Python Learners Group", "Python basics to intermediate coding exercises and projects."},
                new String[]{"Resume and Portfolio Club", "Resume reviews, portfolio feedback, and profile upgrades."},
                new String[]{"System Design Circle", "Design discussions for scalable systems with practical cases."},
                new String[]{"Testing and QA Club", "Unit testing, integration testing, and quality best practices."},
                new String[]{"Typing Speed Champions", "Typing races, practice plans, and consistency tracking."},
                new String[]{"UI Components Club", "Reusable component design with Tailwind and modern patterns."},
                new String[]{"Web Security Guild", "Security basics, OWASP topics, and secure coding awareness."},
                new String[]{"Weekly Contest Force", "Weekly virtual contests with post-contest editorial discussions."},
                new String[]{"Women in Tech Coding Club", "Inclusive coding community with mentorship and growth tracks."}
        );

        int created = 0;
        int verified = 0;
        for (String[] clubSpec : clubsToSeed) {
            String name = clubSpec[0];
            String description = clubSpec[1];

            Club existingClub = clubRepository.findByNameIgnoreCase(name).orElse(null);
            Club club;
            if (existingClub != null) {
                club = existingClub;
                verified++;
            } else {
                Club newClub = new Club();
                newClub.setName(name);
                newClub.setDescription(description);
                newClub.setVisibility(ClubVisibility.PUBLIC);
                newClub.setOwner(owner);
                club = clubRepository.save(newClub);
                created++;
            }

            ensureOwnerMembership(club, club.getOwner());
        }

        logger.info(
                "Club seeding complete. Created: {}, verified existing: {}, total configured: {}",
                created,
                verified,
                clubsToSeed.size());
    }

    private void ensureOwnerMembership(Club club, User owner) {
        if (clubMemberRepository.findByClubIdAndUserId(club.getId(), owner.getId()).isPresent()) {
            return;
        }

        ClubMember ownerMembership = new ClubMember();
        ownerMembership.setClub(club);
        ownerMembership.setUser(owner);
        ownerMembership.setRole(ClubMemberRole.OWNER);
        clubMemberRepository.save(ownerMembership);
    }

    private User resolveSeedContentOwner() {
        List<User> admins = userRepository.findByRoleIn(List.of(Role.ADMIN));
        if (!admins.isEmpty()) {
            return admins.get(0);
        }

        List<User> users = userRepository.findAll();
        if (!users.isEmpty()) {
            return users.get(0);
        }

        String email = "content.seed@unifiedcode.local";
        User seedUser = userRepository.findByEmail(email).orElse(null);
        if (seedUser != null) {
            return seedUser;
        }

        User created = new User();
        created.setName("Content Seed");
        created.setEmail(email);
        created.setUsername("contentseed");
        created.setPublicUserId(userPublicIdService.generateUniquePublicUserId());
        created.setPassword(passwordEncoder.encode("ContentSeed@1234"));
        created.setCollege("Knights Battle Zone");
        created.setRole(Role.ADMIN);
        created.setCreatedAt(LocalDateTime.now());
        User saved = userRepository.save(created);
        logger.info("Created seed owner user: {}", email);
        return saved;
    }

    private void seedCBasicsQuiz(User owner, LocalDateTime startTime, LocalDateTime endTime) {
        String title = "C Basics Booster Quiz (10-Year Access)";
        if (quizRepository.existsByTitle(title)) {
            return;
        }

        Quiz quiz = createBaseQuiz(
                owner,
                title,
                "C language basics: syntax, data types, loops, operators.",
                startTime,
                endTime,
                60);

        List<Question> questions = new ArrayList<>();
        questions.add(createQuestion(quiz, "Which header file is required for printf in C?", "stdio.h", "stdlib.h", "math.h", "string.h"));
        questions.add(createQuestion(quiz, "Which keyword is used to make a variable read-only?", "const", "static", "volatile", "register"));
        questions.add(createQuestion(quiz, "Array indexing in C starts from:", "0", "1", "-1", "depends on compiler"));
        questions.add(createQuestion(quiz, "Which format specifier is used for int in printf?", "%d", "%f", "%c", "%s"));
        questions.add(createQuestion(quiz, "Which is the default entry point function in a C program?", "main", "start", "init", "run"));
        questions.add(createQuestion(quiz, "Single-line comment in C is written as:", "// comment", "/* comment */", "# comment", "-- comment"));
        questions.add(createQuestion(quiz, "Which operator gives remainder after division?", "%", "/", "*", "&"));
        questions.add(createQuestion(quiz, "How many bytes does char typically occupy in C?", "1", "2", "4", "8"));
        questions.add(createQuestion(quiz, "Which loop executes at least once?", "do-while", "while", "for", "foreach"));
        questions.add(createQuestion(quiz, "Best loop when number of iterations is known:", "for", "while", "do-while", "switch"));

        quiz.setQuestions(questions);
        quizRepository.save(quiz);
        logger.info("Seeded quiz: {}", title);
    }

    private void seedCPointersQuiz(User owner, LocalDateTime startTime, LocalDateTime endTime) {
        String title = "C Pointers and Memory Quiz (10-Year Access)";
        if (quizRepository.existsByTitle(title)) {
            return;
        }

        Quiz quiz = createBaseQuiz(
                owner,
                title,
                "Pointers, memory allocation, and address handling in C.",
                startTime,
                endTime,
                70);

        List<Question> questions = new ArrayList<>();
        questions.add(createQuestion(quiz, "Which declaration creates a pointer to int?", "int *p;", "int p;", "pointer int p;", "int &p;"));
        questions.add(createQuestion(quiz, "Which operator returns the address of a variable?", "&", "*", "%", "->"));
        questions.add(createQuestion(quiz, "Which operator dereferences a pointer?", "*", "&", "->", "::"));
        questions.add(createQuestion(quiz, "Which macro represents a null pointer in C?", "NULL", "NIL", "VOID", "0xFF"));
        questions.add(createQuestion(quiz, "Which function allocates dynamic memory in C?", "malloc", "alloc", "new", "create"));
        questions.add(createQuestion(quiz, "Which function frees dynamically allocated memory?", "free", "delete", "remove", "release"));
        questions.add(createQuestion(quiz, "If p is int pointer, p + 1 moves by:", "sizeof(int) bytes", "1 byte", "8 bytes always", "compiler error"));
        questions.add(createQuestion(quiz, "Pointer to pointer to int is declared as:", "int **pp;", "int *pp;", "int pp**;", "int &&pp;"));
        questions.add(createQuestion(quiz, "An uninitialized pointer usually contains:", "garbage address", "NULL always", "0 always", "address of main"));
        questions.add(createQuestion(quiz, "Dereferencing a NULL pointer can cause:", "segmentation fault", "compile warning only", "integer overflow", "nothing"));

        quiz.setQuestions(questions);
        quizRepository.save(quiz);
        logger.info("Seeded quiz: {}", title);
    }

    private void seedCPracticeQuiz(User owner, LocalDateTime startTime, LocalDateTime endTime) {
        String title = "C Practice Output Quiz (10-Year Access)";
        if (quizRepository.existsByTitle(title)) {
            return;
        }

        Quiz quiz = createBaseQuiz(
                owner,
                title,
                "C output tracing and day-to-day programming concepts.",
                startTime,
                endTime,
                75);

        List<Question> questions = new ArrayList<>();
        questions.add(createQuestion(quiz, "Output of integer expression 5/2 in C is:", "2", "2.5", "3", "1"));
        questions.add(createQuestion(quiz, "Output of expression 5%2 is:", "1", "2", "0", "2.5"));
        questions.add(createQuestion(quiz, "If a=3, output of ++a is:", "4", "3", "5", "2"));
        questions.add(createQuestion(quiz, "If a=3, output of a++ is:", "3", "4", "5", "2"));
        questions.add(createQuestion(quiz, "ASCII value of character 'A' is:", "65", "97", "66", "64"));
        questions.add(createQuestion(quiz, "printf with %c and value 66 prints:", "B", "66", "A", "b"));
        questions.add(createQuestion(quiz, "Escape sequence for new line in C is:", "\\n", "\\t", "\\0", "\\r"));
        questions.add(createQuestion(quiz, "Why is '&' used in scanf(\"%d\", &x)?", "to pass address of x", "to pass value of x", "to convert int to char", "to clear input buffer"));
        questions.add(createQuestion(quiz, "Which function compares two strings in C?", "strcmp", "strcpy", "strlen", "strcat"));
        questions.add(createQuestion(quiz, "Which header file is used for string functions?", "string.h", "stdio.h", "stdlib.h", "ctype.h"));

        quiz.setQuestions(questions);
        quizRepository.save(quiz);
        logger.info("Seeded quiz: {}", title);
    }

    private Quiz createBaseQuiz(
            User owner,
            String title,
            String description,
            LocalDateTime startTime,
            LocalDateTime endTime,
            Integer durationMinutes) {
        Quiz quiz = new Quiz();
        quiz.setTitle(title);
        quiz.setDescription(description);
        quiz.setStartTime(startTime);
        quiz.setEndTime(endTime);
        quiz.setDurationMinutes(durationMinutes);
        quiz.setCreatedBy(owner);
        quiz.setIsActive(Boolean.TRUE);
        return quiz;
    }

    private Question createQuestion(Quiz quiz, String text, String correctOption, String option2, String option3, String option4) {
        Question question = new Question();
        question.setQuiz(quiz);
        question.setText(text);
        question.setPoints(1);

        List<Option> options = new ArrayList<>();
        options.add(createOption(question, correctOption, true));
        options.add(createOption(question, option2, false));
        options.add(createOption(question, option3, false));
        options.add(createOption(question, option4, false));
        question.setOptions(options);
        return question;
    }

    private Option createOption(Question question, String text, boolean isCorrect) {
        Option option = new Option();
        option.setQuestion(question);
        option.setText(text);
        option.setIsCorrect(isCorrect);
        return option;
    }

    private void seedEasyCStarterContest(User owner, LocalDateTime startTime, LocalDateTime endTime) {
        String title = "C Easy Kickstart Contest (10-Year Access)";
        Contest contest = resolveOrCreateContest(
                owner,
                title,
                "Starter C contest with 3 very easy problems.",
                startTime,
                endTime,
                90);

        List<Problem> desiredProblems = new ArrayList<>();
        desiredProblems.add(createProblem(
                contest,
                "Add Two Numbers",
                "Read two integers and print their sum.",
                "EASY",
                "Two integers a and b.",
                "Print a+b.",
                "2 3",
                "5",
                "[{\"input\":\"2 3\\n\",\"output\":\"5\\n\"}]",
                100));
        desiredProblems.add(createProblem(
                contest,
                "Even or Odd",
                "Read an integer n and print EVEN if n is even, otherwise ODD.",
                "EASY",
                "Single integer n.",
                "Print EVEN or ODD.",
                "7",
                "ODD",
                "[{\"input\":\"8\\n\",\"output\":\"EVEN\\n\"}]",
                100));
        desiredProblems.add(createProblem(
                contest,
                "Maximum of Three",
                "Read three integers and print the maximum value.",
                "EASY",
                "Three integers a b c.",
                "Print the largest integer.",
                "3 9 4",
                "9",
                "[{\"input\":\"10 8 6\\n\",\"output\":\"10\\n\"}]",
                100));

        int added = ensureContestProblems(contest, desiredProblems);
        logger.info("Contest ready: {} (added {} easy problems)", title, added);
    }

    private void seedCLoopsContest(User owner, LocalDateTime startTime, LocalDateTime endTime) {
        String title = "C Loop Logic Contest (10-Year Access)";
        Contest contest = resolveOrCreateContest(
                owner,
                title,
                "C contest focused on loops and numeric basics.",
                startTime,
                endTime,
                100);

        List<Problem> desiredProblems = new ArrayList<>();
        desiredProblems.add(createProblem(
                contest,
                "Sum of First N Numbers",
                "Given n, print the sum 1+2+...+n.",
                "EASY",
                "Single integer n.",
                "Print sum from 1 to n.",
                "5",
                "15",
                "[{\"input\":\"10\\n\",\"output\":\"55\\n\"}]",
                100));
        desiredProblems.add(createProblem(
                contest,
                "Reverse Number",
                "Given an integer n, print its digits in reverse order.",
                "EASY",
                "Single integer n.",
                "Print reversed integer.",
                "1234",
                "4321",
                "[{\"input\":\"450\\n\",\"output\":\"54\\n\"}]",
                100));
        desiredProblems.add(createProblem(
                contest,
                "Count Digits",
                "Given integer n, print number of digits in n.",
                "EASY",
                "Single integer n.",
                "Print count of digits.",
                "9071",
                "4",
                "[{\"input\":\"100000\\n\",\"output\":\"6\\n\"}]",
                100));

        int added = ensureContestProblems(contest, desiredProblems);
        logger.info("Contest ready: {} (added {} easy problems)", title, added);
    }

    private void seedCStringContest(User owner, LocalDateTime startTime, LocalDateTime endTime) {
        String title = "C String and Number Contest (10-Year Access)";
        Contest contest = resolveOrCreateContest(
                owner,
                title,
                "C contest covering beginner string and number handling.",
                startTime,
                endTime,
                110);

        List<Problem> desiredProblems = new ArrayList<>();
        desiredProblems.add(createProblem(
                contest,
                "Count Vowels",
                "Given a lowercase string, count vowels a,e,i,o,u.",
                "EASY",
                "One lowercase string without spaces.",
                "Print number of vowels.",
                "education",
                "5",
                "[{\"input\":\"programming\\n\",\"output\":\"3\\n\"}]",
                100));
        desiredProblems.add(createProblem(
                contest,
                "Palindrome Number",
                "Given integer n, print YES if palindrome else NO.",
                "EASY",
                "Single integer n.",
                "Print YES or NO.",
                "121",
                "YES",
                "[{\"input\":\"123\\n\",\"output\":\"NO\\n\"}]",
                100));
        desiredProblems.add(createProblem(
                contest,
                "Simple Interest",
                "Given principal P, rate R, time T, print simple interest (P*R*T)/100.",
                "EASY",
                "Three integers P R T.",
                "Print simple interest as integer.",
                "1000 5 2",
                "100",
                "[{\"input\":\"1500 4 3\\n\",\"output\":\"180\\n\"}]",
                100));

        int added = ensureContestProblems(contest, desiredProblems);
        logger.info("Contest ready: {} (added {} easy problems)", title, added);
    }

    private void seedCoreProblemSet(User owner, LocalDateTime startTime, LocalDateTime endTime) {
        String title = "Coding Core Problem Set (100)";
        int longPracticeDurationMinutes = 5_256_000;
        Contest contest = resolveOrCreateContest(
                owner,
                title,
                "Structured large problem set with progressive difficulty for coding rounds.",
                startTime,
                endTime,
                longPracticeDurationMinutes);
        contest.setMode("PROBLEM_SET");
        contest.setDurationMinutes(longPracticeDurationMinutes);
        contestRepository.save(contest);

        int targetProblemCount = Math.max(100, Math.min(coreProblemSetSeedCount, 5000));
        List<Problem> desiredProblems = new ArrayList<>();
        for (int i = 1; i <= targetProblemCount; i++) {
            desiredProblems.add(buildCoreProblem(contest, i, targetProblemCount));
        }

        int added = ensureContestProblems(contest, desiredProblems);
        logger.info("Problem set ready: {} (added {} problems, target {})", title, added, targetProblemCount);
    }

    private Problem buildCoreProblem(Contest contest, int index, int totalProblems) {
        int family = (index - 1) % 10;
        String difficulty = resolveCoreDifficulty(index, totalProblems);
        int points = resolveCorePoints(difficulty);
        int timeLimit = resolveCoreTimeLimit(difficulty);

        String title;
        String description;
        String inputFormat;
        String outputFormat;
        String sampleInput;
        String sampleOutput;
        String hiddenInput;
        String hiddenOutput;

        switch (family) {
            case 0 -> {
                int a = index + 3;
                int b = index * 2;
                int ha = index + 40;
                int hb = index + 70;
                title = String.format("Core Problem %03d - Sum Pair", index);
                description = "Given two integers a and b, print their sum.";
                inputFormat = "Two space-separated integers a and b.";
                outputFormat = "Print a+b.";
                sampleInput = a + " " + b;
                sampleOutput = String.valueOf(a + b);
                hiddenInput = ha + " " + hb;
                hiddenOutput = String.valueOf(ha + hb);
            }
            case 1 -> {
                int a = index * 5;
                int b = index + 9;
                int ha = index * 7;
                int hb = index * 2 + 13;
                title = String.format("Core Problem %03d - Absolute Difference", index);
                description = "Given two integers a and b, print |a-b|.";
                inputFormat = "Two space-separated integers a and b.";
                outputFormat = "Print absolute difference.";
                sampleInput = a + " " + b;
                sampleOutput = String.valueOf(Math.abs(a - b));
                hiddenInput = ha + " " + hb;
                hiddenOutput = String.valueOf(Math.abs(ha - hb));
            }
            case 2 -> {
                int a = index + 2;
                int b = (index % 9) + 3;
                int ha = (index % 11) + 10;
                int hb = (index % 7) + 8;
                title = String.format("Core Problem %03d - Product", index);
                description = "Given two integers a and b, print a*b.";
                inputFormat = "Two space-separated integers a and b.";
                outputFormat = "Print the product.";
                sampleInput = a + " " + b;
                sampleOutput = String.valueOf(a * b);
                hiddenInput = ha + " " + hb;
                hiddenOutput = String.valueOf(ha * hb);
            }
            case 3 -> {
                int a = index + 1;
                int b = index + 9;
                int c = index - 2;
                int ha = index + 11;
                int hb = index + 4;
                int hc = index + 19;
                title = String.format("Core Problem %03d - Max Of Three", index);
                description = "Given three integers, print the maximum value.";
                inputFormat = "Three space-separated integers a b c.";
                outputFormat = "Print max(a,b,c).";
                sampleInput = a + " " + b + " " + c;
                sampleOutput = String.valueOf(Math.max(a, Math.max(b, c)));
                hiddenInput = ha + " " + hb + " " + hc;
                hiddenOutput = String.valueOf(Math.max(ha, Math.max(hb, hc)));
            }
            case 4 -> {
                int n = (index * 137) % 9000 + 1000;
                int hn = (index * 719) % 90000 + 10000;
                title = String.format("Core Problem %03d - Sum Of Digits", index);
                description = "Given integer n, print sum of its digits.";
                inputFormat = "Single positive integer n.";
                outputFormat = "Print sum of digits.";
                sampleInput = String.valueOf(n);
                sampleOutput = String.valueOf(sumDigits(n));
                hiddenInput = String.valueOf(hn);
                hiddenOutput = String.valueOf(sumDigits(hn));
            }
            case 5 -> {
                String s = "code" + index;
                String hs = "logic" + (index + 3);
                title = String.format("Core Problem %03d - Reverse String", index);
                description = "Given a lowercase string, print the reversed string.";
                inputFormat = "Single lowercase string without spaces.";
                outputFormat = "Print reversed string.";
                sampleInput = s;
                sampleOutput = reverseString(s);
                hiddenInput = hs;
                hiddenOutput = reverseString(hs);
            }
            case 6 -> {
                String s = "education" + (index % 7);
                String hs = "programming" + (index % 5);
                title = String.format("Core Problem %03d - Count Vowels", index);
                description = "Given a lowercase string, count vowels a,e,i,o,u.";
                inputFormat = "Single lowercase string without spaces.";
                outputFormat = "Print number of vowels.";
                sampleInput = s;
                sampleOutput = String.valueOf(countVowels(s));
                hiddenInput = hs;
                hiddenOutput = String.valueOf(countVowels(hs));
            }
            case 7 -> {
                int n = (index % 18) + 5;
                int hn = (index % 20) + 8;
                title = String.format("Core Problem %03d - Fibonacci N", index);
                description = "Given n, print nth Fibonacci number where F(0)=0 and F(1)=1.";
                inputFormat = "Single integer n (0 <= n <= 30).";
                outputFormat = "Print F(n).";
                sampleInput = String.valueOf(n);
                sampleOutput = String.valueOf(fibonacci(n));
                hiddenInput = String.valueOf(hn);
                hiddenOutput = String.valueOf(fibonacci(hn));
            }
            case 8 -> {
                int n = (index % 2 == 0) ? 29 : 30 + index;
                int hn = (index % 3 == 0) ? 97 : 90 + index;
                title = String.format("Core Problem %03d - Prime Check", index);
                description = "Given integer n, print YES if n is prime else NO.";
                inputFormat = "Single integer n.";
                outputFormat = "Print YES or NO.";
                sampleInput = String.valueOf(n);
                sampleOutput = isPrime(n) ? "YES" : "NO";
                hiddenInput = String.valueOf(hn);
                hiddenOutput = isPrime(hn) ? "YES" : "NO";
            }
            default -> {
                int a = (index * 6) + 14;
                int b = (index * 4) + 10;
                int ha = (index * 9) + 21;
                int hb = (index * 5) + 16;
                title = String.format("Core Problem %03d - GCD", index);
                description = "Given two integers a and b, print their greatest common divisor.";
                inputFormat = "Two space-separated integers a and b.";
                outputFormat = "Print gcd(a,b).";
                sampleInput = a + " " + b;
                sampleOutput = String.valueOf(gcd(a, b));
                hiddenInput = ha + " " + hb;
                hiddenOutput = String.valueOf(gcd(ha, hb));
            }
        }

        Problem problem = createProblem(
                contest,
                title,
                description,
                difficulty,
                inputFormat,
                outputFormat,
                sampleInput,
                sampleOutput,
                buildSingleHiddenTestCase(hiddenInput, hiddenOutput),
                points);
        problem.setTimeLimitSeconds(timeLimit);
        problem.setDifficultyWeight(resolveDifficultyWeight(difficulty));
        return problem;
    }

    private String resolveCoreDifficulty(int index, int totalProblems) {
        int easyCutoff = (int) Math.floor(totalProblems * 0.4);
        int mediumCutoff = (int) Math.floor(totalProblems * 0.8);
        if (index <= easyCutoff) return "EASY";
        if (index <= mediumCutoff) return "MEDIUM";
        return "HARD";
    }

    private int resolveCorePoints(String difficulty) {
        return switch (difficulty) {
            case "EASY" -> 120;
            case "MEDIUM" -> 180;
            default -> 240;
        };
    }

    private int resolveCoreTimeLimit(String difficulty) {
        return switch (difficulty) {
            case "EASY" -> 2;
            case "MEDIUM" -> 3;
            default -> 4;
        };
    }

    private double resolveDifficultyWeight(String difficulty) {
        return switch (difficulty) {
            case "EASY" -> 1.0;
            case "MEDIUM" -> 1.5;
            default -> 2.0;
        };
    }

    private String buildSingleHiddenTestCase(String input, String output) {
        return "[{\"input\":\"" + escapeJson(input + "\n") + "\",\"output\":\"" + escapeJson(output + "\n") + "\"}]";
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    private int sumDigits(int number) {
        int n = Math.abs(number);
        int sum = 0;
        while (n > 0) {
            sum += (n % 10);
            n /= 10;
        }
        return sum;
    }

    private String reverseString(String value) {
        return new StringBuilder(value).reverse().toString();
    }

    private int countVowels(String value) {
        int count = 0;
        for (int i = 0; i < value.length(); i++) {
            char ch = Character.toLowerCase(value.charAt(i));
            if (ch == 'a' || ch == 'e' || ch == 'i' || ch == 'o' || ch == 'u') {
                count++;
            }
        }
        return count;
    }

    private int fibonacci(int n) {
        if (n <= 1) {
            return n;
        }
        int a = 0;
        int b = 1;
        for (int i = 2; i <= n; i++) {
            int c = a + b;
            a = b;
            b = c;
        }
        return b;
    }

    private boolean isPrime(int n) {
        if (n <= 1) return false;
        if (n <= 3) return true;
        if (n % 2 == 0 || n % 3 == 0) return false;
        for (int i = 5; i * i <= n; i += 6) {
            if (n % i == 0 || n % (i + 2) == 0) {
                return false;
            }
        }
        return true;
    }

    private int gcd(int a, int b) {
        int x = Math.abs(a);
        int y = Math.abs(b);
        while (y != 0) {
            int t = x % y;
            x = y;
            y = t;
        }
        return x == 0 ? 1 : x;
    }

    private Contest resolveOrCreateContest(
            User owner,
            String title,
            String description,
            LocalDateTime startTime,
            LocalDateTime endTime,
            Integer durationMinutes) {

        Contest existingContest = contestRepository.findAll()
                .stream()
                .filter(contest -> title.equals(contest.getTitle()))
                .findFirst()
                .orElse(null);

        if (existingContest != null) {
            return existingContest;
        }

        Contest contest = createBaseContest(owner, title, description, startTime, endTime, durationMinutes);
        return contestRepository.save(contest);
    }

    private int ensureContestProblems(Contest contest, List<Problem> desiredProblems) {
        List<Problem> existingProblems = problemRepository.findByContestId(contest.getId());
        Set<String> existingTitles = new HashSet<>();
        for (Problem problem : existingProblems) {
            if (problem.getTitle() == null || problem.getTitle().isBlank()) {
                continue;
            }
            existingTitles.add(problem.getTitle().trim().toLowerCase());
        }

        int added = 0;
        for (Problem problem : desiredProblems) {
            String key = problem.getTitle() == null ? "" : problem.getTitle().trim().toLowerCase();
            if (key.isBlank() || existingTitles.contains(key)) {
                continue;
            }
            problemRepository.save(problem);
            existingTitles.add(key);
            added++;
        }
        return added;
    }

    private Contest createBaseContest(
            User owner,
            String title,
            String description,
            LocalDateTime startTime,
            LocalDateTime endTime,
            Integer durationMinutes) {
        Contest contest = new Contest();
        contest.setTitle(title);
        contest.setDescription(description);
        contest.setStartTime(startTime);
        contest.setEndTime(endTime);
        contest.setDurationMinutes(durationMinutes);
        contest.setCreatedBy(owner);
        contest.setMode("STANDARD");
        return contest;
    }

    private Problem createProblem(
            Contest contest,
            String title,
            String description,
            String difficulty,
            String inputFormat,
            String outputFormat,
            String sampleInput,
            String sampleOutput,
            String testCases,
            Integer points) {
        Problem problem = new Problem();
        problem.setContest(contest);
        problem.setTitle(title);
        problem.setDescription(description);
        problem.setDifficulty(difficulty);
        problem.setInputFormat(inputFormat);
        problem.setOutputFormat(outputFormat);
        problem.setSampleInput(sampleInput);
        problem.setSampleOutput(sampleOutput);
        problem.setTestCases(testCases);
        problem.setPoints(points);
        problem.setTimeLimitSeconds(2);
        problem.setDifficultyWeight(1.0);
        return problem;
    }

    private void bootstrapPrivilegedUser(
            String email,
            String password,
            String username,
            String name,
            String college,
            Role role) {

        if (email == null || email.isBlank()) {
            logger.warn("Skipping {} bootstrap: email is missing.", role);
            return;
        }
        if (password == null || password.length() < 12) {
            logger.warn("Skipping {} bootstrap for {}: password must be at least 12 characters.", role, email);
            return;
        }
        if (userRepository.findByEmail(email).isPresent()) {
            logger.info("{} account already exists: {}", role, email);
            return;
        }

        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setPublicUserId(userPublicIdService.generateUniquePublicUserId());
        user.setPassword(passwordEncoder.encode(password));
        user.setName(name);
        user.setCollege(college);
        user.setRole(role);
        user.setCreatedAt(LocalDateTime.now());
        userRepository.save(user);
        logger.info("{} user created: {}", role, email);
    }
}

