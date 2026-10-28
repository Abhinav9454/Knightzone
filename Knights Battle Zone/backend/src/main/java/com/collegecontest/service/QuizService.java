package com.collegecontest.service;

import com.collegecontest.dto.OptionDTO;
import com.collegecontest.dto.QuestionDTO;
import com.collegecontest.dto.QuizDTO;
import com.collegecontest.dto.UserDTO;
import com.collegecontest.model.Option;
import com.collegecontest.model.Question;
import com.collegecontest.model.Quiz;
import com.collegecontest.model.Role;
import com.collegecontest.model.User;
import com.collegecontest.repository.AnswerRepository;
import com.collegecontest.repository.QuizAttemptRepository;
import com.collegecontest.repository.QuizRepository;
import com.collegecontest.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class QuizService {

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuizAttemptRepository quizAttemptRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Transactional
    public Page<QuizDTO> getAllQuizzes(Pageable pageable) {
        return quizRepository.findAll(pageable)
                .map(this::convertToDTO);
    }

    @Transactional
    public QuizDTO getQuizById(Long id) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quiz not found with id: " + id));

        // Force initialize lazy collections
        quiz.getQuestions().forEach(q -> q.getOptions().size());

        return convertToDTO(quiz);
    }

    @Transactional
    public QuizDTO createQuiz(QuizDTO dto, String userEmail) {

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        Quiz quiz = new Quiz();
        quiz.setTitle(dto.getTitle());
        quiz.setDescription(dto.getDescription());

        // ✅ Safe Start Time
        if (dto.getStartTime() != null) {
            quiz.setStartTime(dto.getStartTime());
        } else {
            quiz.setStartTime(LocalDateTime.now());
        }

        // ✅ Safe End Time
        if (dto.getEndTime() != null) {
            quiz.setEndTime(dto.getEndTime());
        } else {
            quiz.setEndTime(LocalDateTime.now().plusHours(1));
        }

        // ✅ Safe Duration
        if (dto.getDurationMinutes() != null) {
            quiz.setDurationMinutes(dto.getDurationMinutes());
        } else {
            quiz.setDurationMinutes(60);
        }

        quiz.setCreatedBy(user);

        // ✅ Questions Handling
        if (dto.getQuestions() != null && !dto.getQuestions().isEmpty()) {
            quiz.setQuestions(buildQuestions(dto.getQuestions(), quiz));
        }

        Quiz saved = quizRepository.save(quiz);
        return convertToDTO(saved);
    }

    @Transactional
    public QuizDTO updateQuiz(Long quizId, QuizDTO dto, String userEmail) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found with id: " + quizId));
        User actingUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        boolean isAdmin = actingUser.getRole() == Role.ADMIN;
        boolean isCreator = quiz.getCreatedBy() != null && quiz.getCreatedBy().getId().equals(actingUser.getId());
        if (!isAdmin && !isCreator) {
            throw new RuntimeException("Only quiz creator or admin can update this quiz");
        }

        if (dto.getTitle() != null && !dto.getTitle().isBlank()) {
            quiz.setTitle(dto.getTitle().trim());
        }
        if (dto.getDescription() != null) {
            quiz.setDescription(dto.getDescription().trim());
        }
        if (dto.getStartTime() != null) {
            quiz.setStartTime(dto.getStartTime());
        }
        if (dto.getEndTime() != null) {
            quiz.setEndTime(dto.getEndTime());
        }
        if (dto.getDurationMinutes() != null && dto.getDurationMinutes() > 0) {
            quiz.setDurationMinutes(dto.getDurationMinutes());
        }

        if (quiz.getStartTime() != null && quiz.getEndTime() != null && !quiz.getEndTime().isAfter(quiz.getStartTime())) {
            throw new RuntimeException("Quiz end time must be after start time");
        }

        if (dto.getQuestions() != null) {
            quiz.getQuestions().clear();
            quiz.getQuestions().addAll(buildQuestions(dto.getQuestions(), quiz));
        }

        Quiz saved = quizRepository.save(quiz);
        return convertToDTO(saved);
    }

    @Transactional
    public void deleteQuiz(Long quizId, String userEmail) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found with id: " + quizId));
        User actingUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        boolean isAdmin = actingUser.getRole() == Role.ADMIN;
        if (!isAdmin) {
            throw new RuntimeException("Only admin can delete this quiz");
        }

        // Delete attempt-linked answers first, then attempts, then quiz structure.
        answerRepository.deleteByQuizId(quizId);
        quizAttemptRepository.deleteByQuizId(quizId);
        quizRepository.delete(quiz);
    }

    private List<Question> buildQuestions(List<QuestionDTO> questionDTOs, Quiz quiz) {
        List<Question> questions = new ArrayList<>();

        for (QuestionDTO qdto : questionDTOs) {
            Question question = new Question();
            question.setText(qdto.getText());
            question.setPoints(qdto.getPoints() != null ? qdto.getPoints() : 1);
            question.setQuiz(quiz);

            List<Option> options = new ArrayList<>();
            if (qdto.getOptions() != null) {
                for (OptionDTO odto : qdto.getOptions()) {
                    Option option = new Option();
                    option.setText(odto.getText());
                    option.setIsCorrect(Boolean.TRUE.equals(odto.getIsCorrect()));
                    option.setQuestion(question);
                    options.add(option);
                }
            }
            question.setOptions(options);
            questions.add(question);
        }

        return questions;
    }

    private QuizDTO convertToDTO(Quiz quiz) {
        QuizDTO dto = new QuizDTO();
        dto.setId(quiz.getId());
        dto.setTitle(quiz.getTitle());
        dto.setDescription(quiz.getDescription());
        dto.setStartTime(quiz.getStartTime());
        dto.setEndTime(quiz.getEndTime());
        dto.setDurationMinutes(quiz.getDurationMinutes());
        if (quiz.getCreatedBy() != null) {
            try {
                UserDTO createdBy = new UserDTO();
                createdBy.setId(quiz.getCreatedBy().getId());
                createdBy.setName(quiz.getCreatedBy().getName());
                createdBy.setUsername(quiz.getCreatedBy().getUsername());
                createdBy.setPublicUserId(quiz.getCreatedBy().getPublicUserId());
                createdBy.setEmail(quiz.getCreatedBy().getEmail());
                createdBy.setRole(
                        quiz.getCreatedBy().getRole() != null ? quiz.getCreatedBy().getRole().toString() : null);
                createdBy.setCollege(quiz.getCreatedBy().getCollege());
                createdBy.setDepartment(quiz.getCreatedBy().getDepartment());
                dto.setCreatedBy(createdBy);
            } catch (Exception ignored) {
                // Detached lazy proxy fallback
            }
        }
        dto.setCreatedAt(quiz.getCreatedAt());
        dto.setUpdatedAt(quiz.getUpdatedAt());
        if (quiz.getQuestions() != null) {
            try {
                dto.setQuestions(quiz.getQuestions().stream().map(q -> {
                    QuestionDTO qdto = new QuestionDTO();
                    qdto.setId(q.getId());
                    qdto.setText(q.getText());
                    qdto.setPoints(q.getPoints());
                    if (q.getOptions() != null) {
                        try {
                            qdto.setOptions(q.getOptions().stream().map(o -> {
                                OptionDTO odto = new OptionDTO();
                                odto.setId(o.getId());
                                odto.setText(o.getText());
                                odto.setIsCorrect(o.getIsCorrect());
                                return odto;
                            }).toList());
                        } catch (Exception ignored) {
                            // Detached options fallback
                        }
                    }
                    return qdto;
                }).toList());
            } catch (Exception ignored) {
                // Detached questions fallback
            }
        }
        return dto;
    }
}
