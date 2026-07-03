package com.querymind.querymind_ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SavedQueryRequest {
    @NotNull(message = "Connection ID is required")
    private Long connectionId;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "SQL query is required")
    private String sql;

    private String description;
}
