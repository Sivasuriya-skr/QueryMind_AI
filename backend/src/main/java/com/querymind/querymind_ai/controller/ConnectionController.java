package com.querymind.querymind_ai.controller;

import com.querymind.querymind_ai.dto.ConnectionRequest;
import com.querymind.querymind_ai.dto.ConnectionResponse;
import com.querymind.querymind_ai.dto.SchemaTableInfo;
import com.querymind.querymind_ai.dto.TestConnectionResult;
import com.querymind.querymind_ai.entity.User;
import com.querymind.querymind_ai.repository.UserRepository;
import com.querymind.querymind_ai.service.ConnectionService;
import com.querymind.querymind_ai.service.SchemaDiscoveryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/connections")
@RequiredArgsConstructor
@Tag(name = "Connections", description = "Manage PostgreSQL database connections")
public class ConnectionController {

    private final ConnectionService connectionService;
    private final UserRepository userRepository;
    private final SchemaDiscoveryService schemaDiscoveryService;

    @Operation(summary = "Create a new database connection")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Connection created"),
        @ApiResponse(responseCode = "400", description = "Invalid input or duplicate name")
    })
    @PostMapping
    public ResponseEntity<ConnectionResponse> createConnection(
            @Valid @RequestBody ConnectionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        ConnectionResponse response = connectionService.createConnection(user.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "List all connections for the current user")
    @GetMapping
    public ResponseEntity<List<ConnectionResponse>> getUserConnections(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        return ResponseEntity.ok(connectionService.getUserConnections(user.getId()));
    }

    @Operation(summary = "Delete a database connection")
    @ApiResponse(responseCode = "204", description = "Connection deleted")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConnection(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        connectionService.deleteConnection(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Test an existing database connection")
    @PostMapping("/{id}/test")
    public ResponseEntity<TestConnectionResult> testExistingConnection(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        return ResponseEntity.ok(connectionService.testConnection(id, user.getId()));
    }

    @Operation(summary = "Test a new database connection before saving")
    @PostMapping("/test")
    public ResponseEntity<TestConnectionResult> testNewConnection(
            @Valid @RequestBody ConnectionRequest request) {
        return ResponseEntity.ok(connectionService.testNewConnection(request));
    }

    @Operation(summary = "Discover schema for a database connection")
    @GetMapping("/{id}/schema")
    public ResponseEntity<List<SchemaTableInfo>> discoverSchema(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        return ResponseEntity.ok(connectionService.discoverSchema(id, user.getId()));
    }

    private User getCurrentUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

}
