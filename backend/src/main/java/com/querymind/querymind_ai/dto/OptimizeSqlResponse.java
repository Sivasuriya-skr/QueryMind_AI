package com.querymind.querymind_ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OptimizeSqlResponse {
    private List<Suggestion> suggestions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Suggestion {
        private String title;
        private String description;
        private String suggestedSql;
    }
}
