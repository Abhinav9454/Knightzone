package com.collegecontest.livechat.repository;

import com.collegecontest.livechat.model.LiveChatFeedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LiveChatFeedbackRepository extends JpaRepository<LiveChatFeedback, Long> {
    Optional<LiveChatFeedback> findByConversationIdAndSubmittedById(Long conversationId, Long submittedById);
}
