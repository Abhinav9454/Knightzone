package com.collegecontest.club.controller;

import com.collegecontest.club.dto.ClubMessageDTO;
import com.collegecontest.club.dto.CreateClubMessageRequest;
import com.collegecontest.club.service.ClubService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class ClubWebSocketController {

    private final ClubService clubService;

    @MessageMapping("/clubs/{clubId}/chat")
    public ClubMessageDTO sendChat(
            @DestinationVariable Long clubId,
            @Payload CreateClubMessageRequest request,
            Principal principal
    ) {
        if (principal == null) {
            throw new IllegalStateException("Unauthenticated websocket principal");
        }
        return clubService.createMessageFromSocket(clubId, request.message(), principal.getName());
    }
}

