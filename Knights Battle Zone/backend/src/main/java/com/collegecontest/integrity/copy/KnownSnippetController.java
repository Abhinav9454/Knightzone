package com.collegecontest.integrity.copy;

import com.collegecontest.util.RabinKarpRollingHash;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/known-snippets")
public class KnownSnippetController {

    private final KnownSnippetRepository knownSnippetRepository;

    public KnownSnippetController(KnownSnippetRepository knownSnippetRepository) {
        this.knownSnippetRepository = knownSnippetRepository;
    }

    @PostMapping
    public ResponseEntity<List<KnownSnippet>> addSnippet(@RequestBody AddSnippetRequest req) {
        String normalized = req.getSnippetText() == null ? "" : req.getSnippetText().replaceAll("\\s+", " ").trim();
        if (normalized.isEmpty())
            return ResponseEntity.badRequest().build();

        // split into windows and store window hashes to improve matching granularity
        int window = 200;
        Map<Integer, String> hashes = RabinKarpRollingHash.computeRollingHashes(normalized, window);
        Set<String> unique = new HashSet<>(hashes.values());

        // avoid inserting duplicates
        List<KnownSnippet> existing = knownSnippetRepository.findBySnippetHashIn(new ArrayList<>(unique));
        Set<String> existingHashes = existing.stream().map(KnownSnippet::getSnippetHash).collect(Collectors.toSet());

        List<KnownSnippet> toSave = new ArrayList<>();
        for (String h : unique) {
            if (!existingHashes.contains(h)) {
                KnownSnippet ks = KnownSnippet.builder()
                        .snippetHash(h)
                        .snippetText(req.getSnippetText())
                        .source(req.getSource())
                        .build();
                toSave.add(ks);
            }
        }

        List<KnownSnippet> saved = knownSnippetRepository.saveAll(toSave);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public ResponseEntity<List<KnownSnippet>> listAll() {
        return ResponseEntity.ok(knownSnippetRepository.findAll());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        knownSnippetRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    public static class AddSnippetRequest {
        private String snippetText;
        private String source;

        public String getSnippetText() {
            return snippetText;
        }

        public void setSnippetText(String snippetText) {
            this.snippetText = snippetText;
        }

        public String getSource() {
            return source;
        }

        public void setSource(String source) {
            this.source = source;
        }
    }
}
