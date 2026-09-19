package com.collegecontest.repository;

import com.collegecontest.model.Contest;
import com.collegecontest.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest(properties = {
        "spring.sql.init.mode=never",
        "spring.flyway.enabled=false",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
})
public class ContestRepositoryTest {

    @Autowired
    private ContestRepository contestRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void saveAndFindPaged() {
        User owner = new User();
        owner.setName("Contest Owner");
        owner.setEmail("contest-owner@example.com");
        owner.setPassword("encoded-password");
        owner = userRepository.save(owner);

        Contest c = new Contest();
        c.setTitle("Repo Contest");
        c.setStartTime(LocalDateTime.now());
        c.setEndTime(LocalDateTime.now().plusHours(1));
        c.setCreatedBy(owner);
        contestRepository.save(c);

        Page<Contest> page = contestRepository.findAllByOrderByStartTimeDesc(PageRequest.of(0, 10));
        assertTrue(page.getTotalElements() >= 1);
    }
}
