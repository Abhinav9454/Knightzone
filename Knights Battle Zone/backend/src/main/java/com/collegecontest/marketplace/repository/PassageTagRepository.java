package com.collegecontest.marketplace.repository;

import com.collegecontest.marketplace.model.PassageTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PassageTagRepository extends JpaRepository<PassageTag, Long> {
    List<PassageTag> findByPassageIdOrderByTagAsc(Long passageId);
    void deleteByPassageId(Long passageId);
}

