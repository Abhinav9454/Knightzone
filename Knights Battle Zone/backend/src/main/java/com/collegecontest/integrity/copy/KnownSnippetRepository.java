package com.collegecontest.integrity.copy;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KnownSnippetRepository extends JpaRepository<KnownSnippet, Long> {
    List<KnownSnippet> findBySnippetHashIn(List<String> hashes);
}
