package com.querymind.querymind_ai.service;

import com.querymind.querymind_ai.entity.DatabaseConnection;
import com.querymind.querymind_ai.util.AESUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

@Service
@RequiredArgsConstructor
public class DynamicDataSourceService {

    private static final int TIMEOUT_SECONDS = 5;

    public boolean testConnection(DatabaseConnection conn) {
        String url = buildJdbcUrl(conn.getHost(), conn.getPort(), conn.getDatabaseName());
        String password = conn.getPassword();

        try (Connection connection = DriverManager.getConnection(url, conn.getUsername(), password)) {
            return connection.isValid(TIMEOUT_SECONDS);
        } catch (SQLException e) {
            return false;
        }
    }

    public String testConnectionWithMessage(DatabaseConnection conn) {
        String url = buildJdbcUrl(conn.getHost(), conn.getPort(), conn.getDatabaseName());
        String password = conn.getPassword();

        try (Connection connection = DriverManager.getConnection(url, conn.getUsername(), password)) {
            if (connection.isValid(TIMEOUT_SECONDS)) {
                return "Connection successful";
            }
            return "Connection failed: timeout";
        } catch (SQLException e) {
            return mapSqlExceptionToMessage(e);
        }
    }

    private String mapSqlExceptionToMessage(SQLException e) {
        String message = e.getMessage();

        if (message == null) {
            return "Unknown connection error";
        }

        if (message.contains("Access denied") || message.contains("authentication failed")
                || message.contains("password") || message.contains("user")) {
            return "Authentication failed: check username and password";
        }
        if (message.contains("Unknown database") || message.contains("database") && message.contains("exist")) {
            return "Database not found: \"" + extractValue(message, "database") + "\"";
        }
        if (message.contains("Connection refused") || message.contains("Could not connect")
                || message.contains("timeout") || message.contains("Timeout")) {
            return "Connection refused: host \"" + extractValue(message, "host")
                    + "\" or port may be unreachable";
        }
        if (message.contains("Unknown host") || message.contains("Name or service not known")) {
            return "Unknown host: check the hostname";
        }

        return "Connection failed: " + message;
    }

    private String extractValue(String message, String key) {
        try {
            int idx = message.toLowerCase().indexOf("'" + key);
            if (idx == -1) idx = message.toLowerCase().indexOf(key + " ");
            if (idx == -1) return "unknown";

            int start = message.indexOf("'", idx);
            if (start == -1) {
                int space = message.indexOf(" ", idx);
                return space == -1 ? "unknown" : message.substring(idx, space).trim();
            }
            int end = message.indexOf("'", start + 1);
            return end == -1 ? "unknown" : message.substring(start + 1, end);
        } catch (Exception e) {
            return "unknown";
        }
    }

    private String buildJdbcUrl(String host, int port, String databaseName) {
        return "jdbc:mysql://" + host + ":" + port + "/" + databaseName
                + "?useSSL=false&serverTimezone=UTC&connectTimeout=5000&socketTimeout=5000";
    }

}
