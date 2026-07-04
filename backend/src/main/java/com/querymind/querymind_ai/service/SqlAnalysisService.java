package com.querymind.querymind_ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.querymind.querymind_ai.ai.AiProvider;
import com.querymind.querymind_ai.dto.ExecutionPlanResponse;
import com.querymind.querymind_ai.dto.ExplainSqlResponse;
import com.querymind.querymind_ai.dto.OptimizeSqlResponse;
import com.querymind.querymind_ai.dto.OptimizeSqlResponse.Suggestion;
import com.querymind.querymind_ai.entity.DatabaseConnection;
import com.querymind.querymind_ai.repository.DatabaseConnectionRepository;
import com.querymind.querymind_ai.util.AESUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.sql.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SqlAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(SqlAnalysisService.class);
    private static final int EXPLAIN_TIMEOUT_SECONDS = 10;

    private final AiProvider aiProvider;
    private final DatabaseConnectionRepository connectionRepository;
    private final AESUtil aesUtil;
    private final SchemaDiscoveryService schemaDiscoveryService;
    private final ObjectMapper objectMapper;

    private static final String EXPLAIN_PROMPT_TEMPLATE = """
You are a PostgreSQL expert. Explain the following SQL query in plain English.

Database Schema:
%s

SQL Query:
%s

Your explanation must cover:
1. What the query does overall
2. Which tables and columns are referenced
3. What conditions / filters are applied (WHERE, HAVING, JOIN conditions)
4. The expected shape of the output (columns and row characteristics)

Write the explanation in clear, concise plain English suitable for a non-technical user.
""";

    private static final String OPTIMIZE_PROMPT_TEMPLATE = """
You are a PostgreSQL performance expert. Review the following SQL query and the database schema, then suggest optimizations.

Database Schema:
%s

SQL Query:
%s

For each optimization, provide:
- A short title (one line)
- A description of the problem and how to fix it
- Optionally, a rewritten SQL query (the full improved query)

Respond ONLY with a JSON array of objects, each with keys: "title", "description", "suggestedSql" (suggestedSql is optional, omit if no rewrite is needed).
Example:
[
  {
    "title": "Add index on employees.department_id",
    "description": "The query filters by department_id but no index exists...",
    "suggestedSql": null
  }
]
""";

    private static final String EXECUTION_PLAN_INTERPRET_PROMPT_TEMPLATE = """
You are a PostgreSQL performance expert. Interpret the following EXPLAIN output for a query.

Database Schema:
%s

SQL Query:
%s

EXPLAIN Output (JSON):
%s

Explain in plain English:
1. Is this query efficient? Why or why not?
2. Which indexes are used or missing?
3. Are there any full table scans, temporary tables, or filesorts?
4. What would you recommend to improve performance?

Keep the explanation concise and actionable.
""";

    public ExplainSqlResponse explainSql(Long connectionId, Long userId, String sql) {
        DatabaseConnection conn = getConnection(connectionId, userId);
        String schema = schemaDiscoveryService.discoverSchema(conn);
        String systemPrompt = String.format(EXPLAIN_PROMPT_TEMPLATE, schema, sql);

        try {
            String raw = aiProvider.generate(systemPrompt, "Explain this SQL query.");
            return ExplainSqlResponse.builder().explanation(raw).build();
        } catch (Exception e) {
            log.error("explainSql failed for connectionId={}", connectionId, e);
            String errMsg = e.getMessage() != null ? e.getMessage() : e.toString();
            throw new RuntimeException("AI explanation failed: " + errMsg, e);
        }
    }

    public OptimizeSqlResponse optimizeSql(Long connectionId, Long userId, String sql) {
        DatabaseConnection conn = getConnection(connectionId, userId);
        String schema = schemaDiscoveryService.discoverSchema(conn);
        String systemPrompt = String.format(OPTIMIZE_PROMPT_TEMPLATE, schema, sql);

        try {
            String raw = aiProvider.generate(systemPrompt, "Optimize this SQL query.");
            List<Suggestion> suggestions = parseSuggestions(raw);
            return OptimizeSqlResponse.builder().suggestions(suggestions).build();
        } catch (Exception e) {
            log.error("optimizeSql failed for connectionId={}", connectionId, e);
            String errMsg = e.getMessage() != null ? e.getMessage() : e.toString();
            throw new RuntimeException("AI optimization failed: " + errMsg, e);
        }
    }

    public ExecutionPlanResponse getExecutionPlan(Long connectionId, Long userId, String sql) {
        DatabaseConnection conn = getConnection(connectionId, userId);
        String url = buildJdbcUrl(conn.getHost(), conn.getPort(), conn.getDatabaseName());
        String password = aesUtil.decrypt(conn.getPassword());

        List<Map<String, Object>> rawPlan = new ArrayList<>();

        try (Connection connection = DriverManager.getConnection(url, conn.getUsername(), password);
             Statement statement = connection.createStatement()) {

            statement.setQueryTimeout(EXPLAIN_TIMEOUT_SECONDS);

            try (ResultSet rs = statement.executeQuery("EXPLAIN (FORMAT JSON) " + sql)) {
                if (rs.next()) {
                    String jsonPlan = rs.getString(1);
                    rawPlan.add(Map.of("EXPLAIN", jsonPlan));
                }
            } catch (SQLException e) {
                try (ResultSet rs = statement.executeQuery("EXPLAIN " + sql)) {
                    ResultSetMetaData meta = rs.getMetaData();
                    int colCount = meta.getColumnCount();
                    while (rs.next()) {
                        Map<String, Object> row = new LinkedHashMap<>();
                        for (int i = 1; i <= colCount; i++) {
                            row.put(meta.getColumnLabel(i), rs.getObject(i));
                        }
                        rawPlan.add(row);
                    }
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to retrieve execution plan: " + mapSqlError(e), e);
        }

        String schema = schemaDiscoveryService.discoverSchema(conn);
        String planText;
        try {
            planText = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(rawPlan);
        } catch (JsonProcessingException e) {
            planText = rawPlan.toString();
        }

        String interpretationPrompt = String.format(EXECUTION_PLAN_INTERPRET_PROMPT_TEMPLATE, schema, sql, planText);
        String interpretation;

        try {
            interpretation = aiProvider.generate(interpretationPrompt, "Interpret this execution plan.");
        } catch (Exception e) {
            log.error("AI execution plan interpretation failed for connectionId={}", connectionId, e);
            interpretation = "AI interpretation is unavailable: " + e.getMessage();
        }

        return ExecutionPlanResponse.builder()
                .rawPlan(rawPlan)
                .aiInterpretation(interpretation)
                .build();
    }

    private List<Suggestion> parseSuggestions(String raw) {
        try {
            String json = raw.trim();
            if (json.startsWith("```")) {
                json = json.replaceAll("```(?:json)?", "").trim();
            }
            List<Map<String, Object>> items = objectMapper.readValue(json,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
            List<Suggestion> suggestions = new ArrayList<>();
            for (Map<String, Object> item : items) {
                String title = (String) item.getOrDefault("title", "");
                String description = (String) item.getOrDefault("description", "");
                String suggestedSql = (String) item.get("suggestedSql");
                suggestions.add(Suggestion.builder()
                        .title(title)
                        .description(description)
                        .suggestedSql(suggestedSql)
                        .build());
            }
            return suggestions;
        } catch (Exception e) {
            log.warn("Failed to parse AI optimization suggestions, returning raw text as single suggestion", e);
            return List.of(Suggestion.builder()
                    .title("AI Suggestions")
                    .description(raw)
                    .build());
        }
    }

    private DatabaseConnection getConnection(Long connectionId, Long userId) {
        return connectionRepository.findByIdAndUserId(connectionId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Connection not found"));
    }

    private String mapSqlError(SQLException e) {
        String msg = e.getMessage();
        if (msg == null) return "Unknown database error";
        if (msg.contains("Access denied")) return "Authentication failed";
        if (msg.contains("Unknown column")) {
            int start = msg.indexOf("'");
            int end = msg.indexOf("'", start + 1);
            String col = (start >= 0 && end > start) ? msg.substring(start + 1, end) : "unknown";
            return "Unknown column: " + col;
        }
        if (msg.contains("relation") && msg.contains("does not exist")) {
            int start = msg.indexOf("\"");
            int end = msg.indexOf("\"", start + 1);
            String tbl = (start >= 0 && end > start) ? msg.substring(start + 1, end) : "unknown";
            return "Table not found: " + tbl;
        }
        return msg;
    }

    private String buildJdbcUrl(String host, int port, String databaseName) {
        return "jdbc:postgresql://" + host + ":" + port + "/" + databaseName;
    }
}
