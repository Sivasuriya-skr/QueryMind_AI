package com.querymind.querymind_ai.service;

import com.querymind.querymind_ai.dto.ExecuteSqlResponse;
import com.querymind.querymind_ai.dto.ValidateSqlResponse;
import com.querymind.querymind_ai.entity.DatabaseConnection;
import com.querymind.querymind_ai.entity.QueryHistory;
import com.querymind.querymind_ai.repository.DatabaseConnectionRepository;
import com.querymind.querymind_ai.util.AESUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.sql.*;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SqlExecutionService {

    private static final Logger log = LoggerFactory.getLogger(SqlExecutionService.class);
    private static final int QUERY_TIMEOUT_SECONDS = 30;

    private final DatabaseConnectionRepository connectionRepository;
    private final AESUtil aesUtil;
    private final SqlValidationService validationService;
    private final QueryHistoryService historyService;

    public ExecuteSqlResponse execute(Long connectionId, Long userId, String rawSql) {
        return execute(connectionId, userId, rawSql, null, null);
    }

    public ExecuteSqlResponse execute(Long connectionId, Long userId, String rawSql,
                                       String naturalLanguageQuestion, String generatedSql) {
        ValidateSqlResponse validation = validationService.validate(rawSql);
        if (!validation.isValid()) {
            historyService.record(userId, connectionId, naturalLanguageQuestion, generatedSql,
                    rawSql, null, null, QueryHistory.QueryStatus.BLOCKED);
            throw new IllegalArgumentException("Validation failed: " + validation.getReason());
        }

        DatabaseConnection conn = connectionRepository.findByIdAndUserId(connectionId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Connection not found"));

        String safeSql = validationService.enforceLimit(rawSql);

        try {
            ExecuteSqlResponse result = executeOnConnection(conn, userId, safeSql);
            historyService.record(userId, connectionId, naturalLanguageQuestion, generatedSql,
                    safeSql, result.getExecutionTimeMs(), result.getRowCount(),
                    QueryHistory.QueryStatus.SUCCESS);
            return result;
        } catch (RuntimeException e) {
            historyService.record(userId, connectionId, naturalLanguageQuestion, generatedSql,
                    safeSql, null, null, QueryHistory.QueryStatus.FAILED);
            throw e;
        }
    }

    private ExecuteSqlResponse executeOnConnection(DatabaseConnection conn, Long userId, String sql) {
        String url = buildJdbcUrl(conn.getHost(), conn.getPort(), conn.getDatabaseName());
        String password = aesUtil.decrypt(conn.getPassword());

        List<String> columns = new ArrayList<>();
        List<Map<String, Object>> rows = new ArrayList<>();
        Instant start = Instant.now();

        try (Connection connection = DriverManager.getConnection(url, conn.getUsername(), password);
             Statement statement = connection.createStatement()) {

            statement.setQueryTimeout(QUERY_TIMEOUT_SECONDS);

            try (ResultSet rs = statement.executeQuery(sql)) {
                ResultSetMetaData metaData = rs.getMetaData();
                int columnCount = metaData.getColumnCount();

                for (int i = 1; i <= columnCount; i++) {
                    columns.add(metaData.getColumnLabel(i));
                }

                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    for (int i = 1; i <= columnCount; i++) {
                        row.put(metaData.getColumnLabel(i), rs.getObject(i));
                    }
                    rows.add(row);
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Query execution failed: " + mapSqlError(e), e);
        }

        long elapsed = Duration.between(start, Instant.now()).toMillis();
        log.info("userId={} db={} rows={} execTime={}ms sql={}",
                userId, conn.getDatabaseName(), rows.size(), elapsed, sql);

        return ExecuteSqlResponse.builder()
                .columns(columns)
                .rows(rows)
                .rowCount(rows.size())
                .executionTimeMs(elapsed)
                .build();
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
        return "jdbc:postgresql://" + host + ":" + port + "/" + databaseName
                + "?connectTimeout=5&socketTimeout=5";
    }

}
