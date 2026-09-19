package com.collegecontest.typing.dto;

import lombok.Data;

@Data
public class TypingTextDTO {
    private Long id;
    private String content;
    private String category;
    private String difficulty;
    private String source;
}

