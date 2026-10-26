package com.collegecontest.service;

import com.collegecontest.dto.AnswerDTO;
import com.collegecontest.dto.QuizAttemptDTO;
import com.collegecontest.model.Answer;
import com.collegecontest.model.Option;
import com.collegecontest.model.Question;
import com.collegecontest.model.Quiz;
import com.collegecontest.model.QuizAttempt;
import com.collegecontest.model.User;
import com.collegecontest.repository.AnswerRepository;
import com.collegecontest.repository.OptionRepository;
import com.collegecontest.repository.QuestionRepository;
import com.collegecontest.repository.QuizAttemptRepository;
import com.collegecontest.repository.QuizRepository;
import com.collegecontest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class QuizAttemptService {

    @Autowired
    private QuizAttemptRepository quizAttemptRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private OptionRepository optionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Transactional
    public QuizAttemptDTO submitAttempt(QuizAttemptDTO dto, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        Quiz quiz = quizRepository.findById(dto.getQuizId())
                .orElseThrow(() -> new RuntimeException("Quiz not found with id: " + dto.getQuizId()));

        // If user already attempted, reuse/update existing attempt; otherwise create new
        QuizAttempt attempt = quizAttemptRepository.findByUserIdAndQuizId(user.getId(), quiz.getId())
                .orElseGet(() -> {
                    QuizAttempt newAttempt = new QuizAttempt();
                    newAttempt.setUser(user);
                    newAttempt.setQuiz(quiz);
                    return newAttempt;
                });

        attempt.setSubmittedAt(LocalDateTime.now());
        attempt.setScore(0);
        attempt.setTotalPoints(0);

        if (attempt.getId() != null) {
            answerRepository.deleteByQuizAttemptId(attempt.getId());
        }

        try {
            attempt = quizAttemptRepository.save(attempt);
        } catch (DataIntegrityViolationException dataIntegrityViolationException) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Unable to save quiz attempt");
        }

        int totalScore = 0;
        int totalPoints = 0;
        List<Answer> savedAnswers = new ArrayList<>();

        if (dto.getAnswers() != null && !dto.getAnswers().isEmpty()) {
            for (AnswerDTO aDto : dto.getAnswers()) {
                Question question = questionRepository.findById(aDto.getQuestionId())
                        .orElseThrow(() -> new RuntimeException("Question not found"));

                Answer answer = new Answer();
                answer.setQuizAttempt(attempt);
                answer.setQuestion(question);

                totalPoints += question.getPoints() != null ? question.getPoints() : 0;

                if (aDto.getSelectedOption() != null) {
                    Option option = optionRepository.findById(aDto.getSelectedOption())
                            .orElseThrow(() -> new RuntimeException("Option not found"));

                    answer.setSelectedOption(option);
                    boolean isCorrect = Boolean.TRUE.equals(option.getIsCorrect());
                    answer.setIsCorrect(isCorrect);

                    if (isCorrect) {
                        totalScore += question.getPoints() != null ? question.getPoints() : 0;
                    }
                } else {
                    answer.setIsCorrect(false);
                }

                savedAnswers.add(answer);
            }
        }

        attempt.setScore(totalScore);
        attempt.setTotalPoints(totalPoints);

        QuizAttempt savedAttempt = quizAttemptRepository.save(attempt);
        answerRepository.saveAll(savedAnswers);

        return convertToDTO(savedAttempt, savedAnswers);
    }

    @Transactional(readOnly = true)
    public QuizAttemptDTO getAttemptById(Long id) {
        QuizAttempt attempt = quizAttemptRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quiz attempt not found with id: " + id));
        // Initialize answers collection
        attempt.getAnswers().size();
        return convertToDTO(attempt, attempt.getAnswers());
    }

    @Transactional(readOnly = true)
    public List<QuizAttemptDTO> getAttemptsByUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        List<QuizAttempt> attempts = quizAttemptRepository.findByUserId(user.getId());
        return attempts.stream().map(a -> convertToDTO(a, a.getAnswers())).toList();
    }

    private QuizAttemptDTO convertToDTO(QuizAttempt attempt, List<com.collegecontest.model.Answer> answers) {
        QuizAttemptDTO dto = new QuizAttemptDTO();
        dto.setId(attempt.getId());
        dto.setQuizId(attempt.getQuiz().getId());
        dto.setQuizTitle(attempt.getQuiz().getTitle());
        dto.setScore(attempt.getScore());
        dto.setTotalPoints(attempt.getTotalPoints());
        dto.setSubmittedAt(attempt.getSubmittedAt());
        if (answers != null && !answers.isEmpty()) {
            dto.setAnswers(answers.stream().map(a -> {
                com.collegecontest.dto.AnswerDTO ad = new com.collegecontest.dto.AnswerDTO();
                ad.setQuestionId(a.getQuestion().getId());
                ad.setSelectedOption(a.getSelectedOption() != null ? a.getSelectedOption().getId() : null);
                return ad;
            }).toList());
        }
        return dto;
    }
}
