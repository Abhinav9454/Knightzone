package com.collegecontest.repository;

import com.collegecontest.model.Quiz;
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
public class QuizRepositoryTest {

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void saveAndFindPaged() {
        User owner = new User();
        owner.setName("Quiz Owner");
        owner.setEmail("quiz-owner@example.com");
        owner.setPassword("encoded-password");
        owner = userRepository.save(owner);

        Quiz q = new Quiz();
        q.setTitle("Repo Quiz");
        q.setStartTime(LocalDateTime.now());
        q.setEndTime(LocalDateTime.now().plusHours(1));
        q.setDurationMinutes(60);
        q.setCreatedBy(owner);

        quizRepository.save(q);

        Page<Quiz> page = quizRepository.findAll(PageRequest.of(0, 10));

        assertNotNull(page);
        assertTrue(page.getTotalElements() >= 1);
    }
}
