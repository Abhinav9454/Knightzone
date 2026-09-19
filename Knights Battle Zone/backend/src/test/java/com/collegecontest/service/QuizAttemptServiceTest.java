package com.collegecontest.service;

import com.collegecontest.dto.AnswerDTO;
import com.collegecontest.dto.QuizAttemptDTO;
import com.collegecontest.model.Option;
import com.collegecontest.model.Question;
import com.collegecontest.model.Quiz;
import com.collegecontest.model.QuizAttempt;
import com.collegecontest.model.User;
import com.collegecontest.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class QuizAttemptServiceTest {

    @Mock
    private QuizAttemptRepository quizAttemptRepository;
    @Mock
    private QuizRepository quizRepository;
    @Mock
    private QuestionRepository questionRepository;
    @Mock
    private OptionRepository optionRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private AnswerRepository answerRepository;

    @InjectMocks
    private QuizAttemptService quizAttemptService;

    @Test
    void submitAttempt_scoresCorrectly() {
        User user = new User();
        user.setId(2L);
        user.setEmail("a@b.com");
        Quiz quiz = new Quiz();
        quiz.setId(10L);
        Question q = new Question();
        q.setId(20L);
        q.setPoints(5);
        Option opt = new Option();
        opt.setId(30L);
        opt.setIsCorrect(true);

        when(userRepository.findByEmail("a@b.com")).thenReturn(Optional.of(user));
        when(quizRepository.findById(10L)).thenReturn(Optional.of(quiz));
        when(quizAttemptRepository.findByUserIdAndQuizId(user.getId(), quiz.getId())).thenReturn(Optional.empty());
        when(quizAttemptRepository.save(any(QuizAttempt.class))).thenAnswer(inv -> {
            QuizAttempt at = inv.getArgument(0);
            at.setId(99L);
            return at;
        });
        when(questionRepository.findById(20L)).thenReturn(Optional.of(q));
        when(optionRepository.findById(30L)).thenReturn(Optional.of(opt));

        QuizAttemptDTO dto = new QuizAttemptDTO();
        dto.setQuizId(10L);
        AnswerDTO a = new AnswerDTO();
        a.setQuestionId(20L);
        a.setSelectedOption(30L);
        dto.setAnswers(List.of(a));

        QuizAttemptDTO out = quizAttemptService.submitAttempt(dto, "a@b.com");

        assertNotNull(out);
        assertEquals(5, out.getScore());
    }
}
