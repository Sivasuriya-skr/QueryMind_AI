package com.querymind.querymind_ai.service;

import com.querymind.querymind_ai.dto.SchemaColumnInfo;
import com.querymind.querymind_ai.dto.SchemaTableInfo;
import com.querymind.querymind_ai.entity.DatabaseConnection;
import com.querymind.querymind_ai.util.AESUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SchemaDiscoveryService {

    private static final int TIMEOUT_SECONDS = 5;
    private final AESUtil aesUtil;

    public String discoverSchema(DatabaseConnection conn) {
        String url = buildJdbcUrl(conn.getHost(), conn.getPort(), conn.getDatabaseName());
        String password = aesUtil.decrypt(conn.getPassword());

        List<String> tableDefinitions = new ArrayList<>();

        try (Connection connection = DriverManager.getConnection(url, conn.getUsername(), password)) {
            DatabaseMetaData metaData = connection.getMetaData();

            try (ResultSet tables = metaData.getTables(conn.getDatabaseName(), null, "%", new String[]{"TABLE"})) {
                while (tables.next()) {
                    String tableName = tables.getString("TABLE_NAME");
                    String tableDef = describeTable(metaData, conn.getDatabaseName(), tableName);
                    tableDefinitions.add(tableDef);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to discover schema: " + mapSchemaError(e), e);
        }

        if (tableDefinitions.isEmpty()) {
            return "No tables found in database \"" + conn.getDatabaseName() + "\".";
        }

        return String.join("\n\n", tableDefinitions);
    }

    private String describeTable(DatabaseMetaData metaData, String catalog, String tableName) throws SQLException {
        StringBuilder sb = new StringBuilder();
        sb.append("Table: ").append(tableName).append("\nColumns:");

        try (ResultSet columns = metaData.getColumns(catalog, null, tableName, "%")) {
            while (columns.next()) {
                String colName = columns.getString("COLUMN_NAME");
                String colType = columns.getString("TYPE_NAME");
                int colSize = columns.getInt("COLUMN_SIZE");
                String nullable = "YES".equals(columns.getString("IS_NULLABLE")) ? "NULL" : "NOT NULL";

                sb.append("\n  - ").append(colName)
                        .append(" (").append(colType).append(colSize > 0 ? "(" + colSize + ")" : "")
                        .append(", ").append(nullable).append(")");
            }
        }

        try (ResultSet pks = metaData.getPrimaryKeys(catalog, null, tableName)) {
            List<String> pkCols = new ArrayList<>();
            while (pks.next()) {
                pkCols.add(pks.getString("COLUMN_NAME"));
            }
            if (!pkCols.isEmpty()) {
                sb.append("\n  Primary Key: ").append(String.join(", ", pkCols));
            }
        }

        try (ResultSet fks = metaData.getImportedKeys(catalog, null, tableName)) {
            List<String> fkEntries = new ArrayList<>();
            while (fks.next()) {
                String fkCol = fks.getString("FKCOLUMN_NAME");
                String pkTable = fks.getString("PKTABLE_NAME");
                String pkCol = fks.getString("PKCOLUMN_NAME");
                fkEntries.add(fkCol + " -> " + pkTable + "." + pkCol);
            }
            if (!fkEntries.isEmpty()) {
                sb.append("\n  Foreign Keys: ").append(String.join(", ", fkEntries));
            }
        }

        return sb.toString();
    }

    public List<SchemaTableInfo> discoverSchemaDetailed(DatabaseConnection conn) {
        String url = buildJdbcUrl(conn.getHost(), conn.getPort(), conn.getDatabaseName());
        String password = aesUtil.decrypt(conn.getPassword());
        List<SchemaTableInfo> tables = new ArrayList<>();

        try (Connection connection = DriverManager.getConnection(url, conn.getUsername(), password)) {
            DatabaseMetaData metaData = connection.getMetaData();

            try (ResultSet rs = metaData.getTables(conn.getDatabaseName(), null, "%", new String[]{"TABLE"})) {
                while (rs.next()) {
                    String tableName = rs.getString("TABLE_NAME");
                    tables.add(describeTableDetailed(metaData, conn.getDatabaseName(), tableName));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to discover schema: " + mapSchemaError(e), e);
        }

        return tables;
    }

    private SchemaTableInfo describeTableDetailed(DatabaseMetaData metaData, String catalog, String tableName) throws SQLException {
        List<SchemaColumnInfo> columns = new ArrayList<>();
        List<String> pkCols = new ArrayList<>();

        try (ResultSet pks = metaData.getPrimaryKeys(catalog, null, tableName)) {
            while (pks.next()) {
                pkCols.add(pks.getString("COLUMN_NAME"));
            }
        }

        java.util.Map<String, String> fkMap = new java.util.HashMap<>();
        try (ResultSet fks = metaData.getImportedKeys(catalog, null, tableName)) {
            while (fks.next()) {
                fkMap.put(fks.getString("FKCOLUMN_NAME"),
                        fks.getString("PKTABLE_NAME") + "." + fks.getString("PKCOLUMN_NAME"));
            }
        }

        try (ResultSet cols = metaData.getColumns(catalog, null, tableName, "%")) {
            while (cols.next()) {
                String colName = cols.getString("COLUMN_NAME");
                columns.add(new SchemaColumnInfo(
                    colName,
                    cols.getString("TYPE_NAME"),
                    "YES".equals(cols.getString("IS_NULLABLE")),
                    pkCols.contains(colName),
                    fkMap.get(colName)
                ));
            }
        }

        return new SchemaTableInfo(tableName, columns);
    }

    private String mapSchemaError(SQLException e) {
        String msg = e.getMessage();
        if (msg == null) return "Unknown error connecting to database";
        if (msg.contains("Access denied")) return "Authentication failed";
        if (msg.contains("Unknown database")) return "Database not found";
        if (msg.contains("Connection refused")) return "Connection refused";
        return msg;
    }

    private String buildJdbcUrl(String host, int port, String databaseName) {
        return "jdbc:mysql://" + host + ":" + port + "/" + databaseName
                + "?useSSL=false&serverTimezone=UTC&connectTimeout=5000&socketTimeout=5000";
    }
}
