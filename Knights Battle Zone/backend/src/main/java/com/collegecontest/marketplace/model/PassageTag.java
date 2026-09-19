package com.collegecontest.marketplace.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "passage_tags", uniqueConstraints = {
        @UniqueConstraint(name = "uk_passage_tag", columnNames = {"passage_id", "tag"})
}, indexes = {
        @Index(name = "idx_passage_tag_tag", columnList = "tag"),
        @Index(name = "idx_passage_tag_passage", columnList = "passage_id")
})
public class PassageTag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "passage_id", nullable = false)
    private Passage passage;

    @Column(nullable = false, length = 50)
    private String tag;
}

