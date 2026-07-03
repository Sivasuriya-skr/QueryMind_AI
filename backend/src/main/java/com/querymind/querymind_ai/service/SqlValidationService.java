package com.querymind.querymind_ai.service;

import com.querymind.querymind_ai.dto.ValidateSqlResponse;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

@Service
public class SqlValidationService {

    private static final int DEFAULT_LIMIT = 1000;

    private static final List<String> BLOCKED_KEYWORDS = List.of(
            "DROP", "DELETE", "TRUNCATE", "ALTER", "UPDATE",
            "INSERT", "GRANT", "REVOKE", "CREATE", "RENAME",
            "REPLACE", "LOAD", "EXPORT", "IMPORT"
    );

    private static final List<Pattern> BLOCKED_PATTERNS;

    static {
        BLOCKED_PATTERNS = BLOCKED_KEYWORDS.stream()
                .map(kw -> Pattern.compile(
                        "\\b" + kw + "\\b",
                        Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE))
                .toList();
    }

    public ValidateSqlResponse validate(String sql) {
        if (sql == null || sql.isBlank()) {
            return response(false, "SQL query is empty");
        }

        String stripped = stripComments(sql).trim();

        String singleLine = stripped.replace('\n', ' ').replace('\r', ' ').trim();

        for (Pattern pattern : BLOCKED_PATTERNS) {
            if (pattern.matcher(singleLine).find()) {
                return response(false,
                        "Statement contains forbidden keyword. Only SELECT is allowed.");
            }
        }

        if (!startsWithSelect(stripped)) {
            return response(false,
                    "Only SELECT statements are allowed.");
        }

        if (hasMultipleStatements(stripped)) {
            return response(false,
                    "Only a single SQL statement is allowed.");
        }

        return response(true, null);
    }

    public String enforceLimit(String sql) {
        String upper = sql.toUpperCase().trim();
        if (upper.contains("LIMIT")) {
            return sql;
        }
        String trimmed = sql.replaceFirst(";\\s*$", "");
        return trimmed + " LIMIT " + DEFAULT_LIMIT;
    }

    private boolean startsWithSelect(String sql) {
        String upper = sql.toUpperCase().trim();
        return upper.startsWith("SELECT") || upper.startsWith("WITH");
    }

    private boolean hasMultipleStatements(String sql) {
        String trimmed = sql.trim();
        int firstSemicolon = trimmed.indexOf(';');
        if (firstSemicolon == -1) {
            return false;
        }
        String after = trimmed.substring(firstSemicolon + 1).trim();
        return !after.isEmpty();
    }

    private String stripComments(String sql) {
        return sql.replaceAll("--[^\n]*", "")
                  .replaceAll("/\\*[^*]*\\*+(?:[^/*][^*]*\\*+)*/", "")
                  .trim();
    }

    private ValidateSqlResponse response(boolean valid, String reason) {
        return ValidateSqlResponse.builder().valid(valid).reason(reason).build();
    }

}
