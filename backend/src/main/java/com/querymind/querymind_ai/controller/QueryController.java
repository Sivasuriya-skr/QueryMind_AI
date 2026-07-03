package com.querymind.querymind_ai.controller;

import com.querymind.querymind_ai.dto.*;
import com.querymind.querymind_ai.entity.User;
import com.querymind.querymind_ai.repository.UserRepository;
import com.querymind.querymind_ai.service.QueryGenerationService;
import com.querymind.querymind_ai.service.SqlAnalysisService;
import com.querymind.querymind_ai.service.SqlExecutionService;
import com.querymind.querymind_ai.service.SqlValidationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/connections")
@RequiredArgsConstructor
@Tag(name = "Queries", description = "Generate, validate, execute, and analyze SQL queries")
public class QueryController {

    private final QueryGenerationService queryGenerationService;
    private final SqlValidationService sqlValidationService;
    private final SqlExecutionService sqlExecutionService;
    private final SqlAnalysisService sqlAnalysisService;
    private final UserRepository userRepository;

    @Operation(summary = "Generate SQL from natural language")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "SQL generated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request or connection not found"),
        @ApiResponse(responseCode = "500", description = "AI service error")
    })
    @PostMapping("/{id}/generate-sql")
    public ResponseEntity<GenerateSqlResponse> generateSql(
            @PathVariable Long id,
            @Valid @RequestBody GenerateSqlRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        GenerateSqlResponse response = queryGenerationService.generateSql(id, user.getId(), request.getQuestion());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Validate SQL syntax and safety")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Validation result returned")
    })
    @PostMapping("/{id}/validate-sql")
    public ResponseEntity<ValidateSqlResponse> validateSql(
            @PathVariable Long id,
            @Valid @RequestBody ExecuteSqlRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(sqlValidationService.validate(request.getSql()));
    }

    @Operation(summary = "Execute SQL query against the connected database")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Query executed successfully"),
        @ApiResponse(responseCode = "400", description = "Validation failed or connection not found"),
        @ApiResponse(responseCode = "500", description = "Execution error")
    })
    @PostMapping("/{id}/execute-sql")
    public ResponseEntity<ExecuteSqlResponse> executeSql(
            @PathVariable Long id,
            @Valid @RequestBody ExecuteSqlRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        ExecuteSqlResponse result = sqlExecutionService.execute(
                id, user.getId(), request.getSql(),
                request.getNaturalLanguageQuestion(), request.getGeneratedSql());
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "Explain SQL query in plain English")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Explanation generated"),
        @ApiResponse(responseCode = "500", description = "AI service error")
    })
    @PostMapping("/{id}/explain-sql")
    public ResponseEntity<ExplainSqlResponse> explainSql(
            @PathVariable Long id,
            @Valid @RequestBody ExecuteSqlRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        ExplainSqlResponse response = sqlAnalysisService.explainSql(id, user.getId(), request.getSql());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get optimization suggestions for SQL query")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Optimization suggestions generated"),
        @ApiResponse(responseCode = "500", description = "AI service error")
    })
    @PostMapping("/{id}/optimize-sql")
    public ResponseEntity<OptimizeSqlResponse> optimizeSql(
            @PathVariable Long id,
            @Valid @RequestBody ExecuteSqlRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        OptimizeSqlResponse response = sqlAnalysisService.optimizeSql(id, user.getId(), request.getSql());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get EXPLAIN plan and AI interpretation")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Execution plan retrieved and interpreted"),
        @ApiResponse(responseCode = "400", description = "Invalid SQL"),
        @ApiResponse(responseCode = "500", description = "Database or AI service error")
    })
    @PostMapping("/{id}/execution-plan")
    public ResponseEntity<ExecutionPlanResponse> executionPlan(
            @PathVariable Long id,
            @Valid @RequestBody ExecuteSqlRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        ExecutionPlanResponse response = sqlAnalysisService.getExecutionPlan(id, user.getId(), request.getSql());
        return ResponseEntity.ok(response);
    }

    private User getCurrentUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

}
