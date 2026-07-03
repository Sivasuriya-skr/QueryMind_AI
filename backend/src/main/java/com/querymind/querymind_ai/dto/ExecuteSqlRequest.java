package com.querymind.querymind_ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ExecuteSqlRequest {

    @NotBlank(message = "SQL query is required")
    private String sql;

    private String naturalLanguageQuestion;

    private String generatedSql;

}
