package com.collegecontest.livechat.repository;

import com.collegecontest.livechat.model.LiveChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LiveChatMessageRepository extends JpaRepository<LiveChatMessage, Long> {
    List<LiveChatMessage> findTop200ByConversationIdOrderByCreatedAtDesc(Long conversationId);
    Optional<LiveChatMessage> findTopByConversationIdOrderByCreatedAtDesc(Long conversationId);
    long countByConversationId(Long conversationId);
}
