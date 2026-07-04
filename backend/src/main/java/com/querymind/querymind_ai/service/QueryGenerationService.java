package com.querymind.querymind_ai.service;

import com.querymind.querymind_ai.ai.AiProvider;
import com.querymind.querymind_ai.dto.GenerateSqlResponse;
import com.querymind.querymind_ai.entity.DatabaseConnection;
import com.querymind.querymind_ai.repository.DatabaseConnectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class QueryGenerationService {

    private static final String SYSTEM_PROMPT_TEMPLATE = """
You are a PostgreSQL expert that converts natural language questions into SQL queries.

Database Schema:
%s

Rules:
- Output ONLY a single valid PostgreSQL SELECT statement — no markdown, no backticks around the SQL, no extra text.
- If the question cannot be answered with a SELECT query using the tables above, say "I cannot answer this question with the available schema."
- Only reference tables and columns that exist in the schema above.
- Use proper SQL syntax compatible with PostgreSQL 16.
- Include meaningful column aliases where appropriate.
- Do NOT use UNION or UNION ALL unless the question explicitly asks for combining results from separate queries.
- Use JOINs to combine related tables instead of UNION.
- When asked for data from multiple tables, use JOINs on foreign key relationships shown in the schema.
- Do NOT use DDL, DML, or any non-SELECT statements.
- Do NOT add semicolons at the end.
""";

    private final AiProvider aiProvider;
    private final DatabaseConnectionRepository connectionRepository;
    private final SchemaDiscoveryService schemaDiscoveryService;

    public GenerateSqlResponse generateSql(Long connectionId, Long userId, String question) {
        DatabaseConnection conn = connectionRepository.findByIdAndUserId(connectionId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Connection not found"));

        String schema = schemaDiscoveryService.discoverSchema(conn);
        String systemPrompt = String.format(SYSTEM_PROMPT_TEMPLATE, schema);
        String userMessage = "Question: " + question;

        try {
            String rawResponse = aiProvider.generate(systemPrompt, userMessage);
            return parseResponse(rawResponse);
        } catch (Exception e) {
            String errMsg = e.getMessage() != null ? e.getMessage() : e.toString();
            throw new RuntimeException("AI query generation failed: " + errMsg, e);
        }
    }

    private GenerateSqlResponse parseResponse(String raw) {
        if (raw == null || raw.isBlank()) {
            return GenerateSqlResponse.builder()
                    .generatedSql("")
                    .explanation("AI returned an empty response.")
                    .build();
        }

        String[] parts = raw.split("\n---\n", 2);
        String sql = parts[0].trim();
        String explanation = parts.length > 1 ? parts[1].trim() : "";

        return GenerateSqlResponse.builder()
                .generatedSql(sql)
                .explanation(explanation)
                .build();
    }

}
