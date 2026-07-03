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
public class QueryHistoryResponse {
    private Long id;
    private Long connectionId;
    private String naturalLanguageQuestion;
    private String generatedSql;
    private String executedSql;
    private Long executionTimeMs;
    private Integer rowCount;
    private String status;
    private LocalDateTime createdAt;
}
