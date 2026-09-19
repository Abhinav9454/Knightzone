package com.collegecontest.integrity.copy;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Entity
@Table(name = "known_snippets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KnownSnippet implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "snippet_hash", nullable = false, length = 128)
    private String snippetHash;

    @Lob
    @Column(name = "snippet_text")
    private String snippetText;

    @Column(name = "source")
    private String source;
}
