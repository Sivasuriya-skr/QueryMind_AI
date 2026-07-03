package com.querymind.querymind_ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GenerateSqlRequest {

    @NotBlank(message = "Question is required")
    private String question;

}
