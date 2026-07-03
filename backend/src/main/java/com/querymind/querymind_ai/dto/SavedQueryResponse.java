package com.querymind.querymind_ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedQueryResponse {
    private Long id;
    private Long connectionId;
    private String title;
    private String sql;
    private String description;
    private LocalDateTime createdAt;
}
