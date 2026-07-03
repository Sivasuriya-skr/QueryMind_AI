package com.querymind.querymind_ai.service;

import com.querymind.querymind_ai.dto.ConnectionRequest;
import com.querymind.querymind_ai.dto.ConnectionResponse;
import com.querymind.querymind_ai.dto.SchemaTableInfo;
import com.querymind.querymind_ai.dto.TestConnectionResult;
import com.querymind.querymind_ai.entity.DatabaseConnection;
import com.querymind.querymind_ai.repository.DatabaseConnectionRepository;
import com.querymind.querymind_ai.util.AESUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConnectionService {

    private final DatabaseConnectionRepository repository;
    private final AESUtil aesUtil;
    private final DynamicDataSourceService dynamicDataSourceService;
    private final SchemaDiscoveryService schemaDiscoveryService;

    public ConnectionResponse createConnection(Long userId, ConnectionRequest request) {
        if (repository.existsByUserIdAndConnectionName(userId, request.getConnectionName())) {
            throw new IllegalArgumentException("A connection with this name already exists");
        }

        DatabaseConnection entity = DatabaseConnection.builder()
                .userId(userId)
                .connectionName(request.getConnectionName())
                .host(request.getHost())
                .port(request.getPort())
                .databaseName(request.getDatabaseName())
                .username(request.getUsername())
                .password(aesUtil.encrypt(request.getPassword()))
                .build();

        entity = repository.save(entity);
        return toResponse(entity);
    }

    public List<ConnectionResponse> getUserConnections(Long userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public void deleteConnection(Long id, Long userId) {
        DatabaseConnection conn = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Connection not found"));
        repository.delete(conn);
    }

    public TestConnectionResult testConnection(Long id, Long userId) {
        DatabaseConnection conn = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Connection not found"));

        conn.setPassword(aesUtil.decrypt(conn.getPassword()));
        String message = dynamicDataSourceService.testConnectionWithMessage(conn);
        boolean success = message.equals("Connection successful");

        return TestConnectionResult.builder()
                .success(success)
                .message(message)
                .build();
    }

    public List<SchemaTableInfo> discoverSchema(Long id, Long userId) {
        DatabaseConnection conn = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Connection not found"));
        return schemaDiscoveryService.discoverSchemaDetailed(conn);
    }

    public TestConnectionResult testNewConnection(ConnectionRequest request) {
        DatabaseConnection temp = DatabaseConnection.builder()
                .connectionName(request.getConnectionName())
                .host(request.getHost())
                .port(request.getPort())
                .databaseName(request.getDatabaseName())
                .username(request.getUsername())
                .password(request.getPassword())
                .build();

        String message = dynamicDataSourceService.testConnectionWithMessage(temp);
        boolean success = message.equals("Connection successful");

        return TestConnectionResult.builder()
                .success(success)
                .message(message)
                .build();
    }

    private ConnectionResponse toResponse(DatabaseConnection conn) {
        return ConnectionResponse.builder()
                .id(conn.getId())
                .connectionName(conn.getConnectionName())
                .host(conn.getHost())
                .port(conn.getPort())
                .databaseName(conn.getDatabaseName())
                .username(conn.getUsername())
                .createdAt(conn.getCreatedAt())
                .build();
    }

}
