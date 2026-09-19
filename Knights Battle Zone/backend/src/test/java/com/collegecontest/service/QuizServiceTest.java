package com.collegecontest.service;

import com.collegecontest.dto.QuizDTO;
import com.collegecontest.model.Role;
import com.collegecontest.model.Quiz;
import com.collegecontest.model.User;
import com.collegecontest.repository.AnswerRepository;
import com.collegecontest.repository.QuizAttemptRepository;
import com.collegecontest.repository.QuizRepository;
import com.collegecontest.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class QuizServiceTest {

    @Mock
    private QuizRepository quizRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private QuizAttemptRepository quizAttemptRepository;

    @Mock
    private AnswerRepository answerRepository;

    @InjectMocks
    private QuizService quizService;

    @Test
    void getAllQuizzes_returnsPagedDTOs() {

        Quiz q = new Quiz();
        q.setId(5L);
        q.setTitle("Sample Quiz");
        q.setStartTime(LocalDateTime.now());
        q.setEndTime(LocalDateTime.now().plusHours(1));

        Page<Quiz> page = new PageImpl<>(List.of(q));

        when(quizRepository.findAll(PageRequest.of(0, 10)))
                .thenReturn(page);

        Page<QuizDTO> out = quizService.getAllQuizzes(PageRequest.of(0, 10));

        assertNotNull(out);
        assertEquals(1, out.getTotalElements());
        assertEquals("Sample Quiz", out.getContent().get(0).getTitle());
    }

    @Test
    void createQuiz_savesAndReturnsDTO() {

        User user = new User();
        user.setId(7L);
        user.setEmail("admin@example.com");

        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(user));

        Quiz saved = new Quiz();
        saved.setId(8L);
        saved.setTitle("Created Quiz");
        saved.setStartTime(LocalDateTime.now());
        saved.setEndTime(LocalDateTime.now().plusHours(1));

        when(quizRepository.save(any(Quiz.class)))
                .thenReturn(saved);

        QuizDTO dto = new QuizDTO();
        dto.setTitle("Created Quiz");
        dto.setStartTime(LocalDateTime.now());
        dto.setEndTime(LocalDateTime.now().plusHours(1));

        QuizDTO out = quizService.createQuiz(dto, "admin@example.com");

        assertNotNull(out);
        assertEquals(8L, out.getId());
        assertEquals("Created Quiz", out.getTitle());
    }

    @Test
    void deleteQuiz_asAdmin_removesAttemptsAnswersAndQuiz() {
        Quiz quiz = new Quiz();
        quiz.setId(11L);

        User admin = new User();
        admin.setId(21L);
        admin.setEmail("admin@example.com");
        admin.setRole(Role.ADMIN);

        when(quizRepository.findById(11L)).thenReturn(Optional.of(quiz));
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));

        quizService.deleteQuiz(11L, "admin@example.com");

        verify(answerRepository).deleteByQuizId(11L);
        verify(quizAttemptRepository).deleteByQuizId(11L);
        verify(quizRepository).delete(quiz);
    }
}
