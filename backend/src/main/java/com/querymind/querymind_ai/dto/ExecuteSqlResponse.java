package com.querymind.querymind_ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecuteSqlResponse {

    private List<String> columns;
    private List<Map<String, Object>> rows;
    private int rowCount;
    private long executionTimeMs;

}
