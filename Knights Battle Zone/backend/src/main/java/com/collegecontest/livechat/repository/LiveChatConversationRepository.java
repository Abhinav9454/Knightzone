package com.collegecontest.livechat.repository;

import com.collegecontest.livechat.model.LiveChatConversation;
import com.collegecontest.livechat.model.LiveChatConversationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LiveChatConversationRepository extends JpaRepository<LiveChatConversation, Long> {
    List<LiveChatConversation> findByRequesterIdOrderByCreatedAtDesc(Long requesterId);
    List<LiveChatConversation> findByStatusInOrderByCreatedAtAsc(List<LiveChatConversationStatus> statuses);
}
