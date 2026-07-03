package com.querymind.querymind_ai.controller;

import com.querymind.querymind_ai.dto.SavedQueryRequest;
import com.querymind.querymind_ai.dto.SavedQueryResponse;
import com.querymind.querymind_ai.entity.User;
import com.querymind.querymind_ai.repository.UserRepository;
import com.querymind.querymind_ai.service.SavedQueryService;
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
@RequestMapping("/api/saved-queries")
@RequiredArgsConstructor
@Tag(name = "Saved Queries", description = "Bookmarked SQL queries")
public class SavedQueryController {

    private final SavedQueryService savedQueryService;
    private final UserRepository userRepository;

    @Operation(summary = "Save a new query")
    @ApiResponse(responseCode = "201", description = "Query saved")
    @PostMapping
    public ResponseEntity<SavedQueryResponse> create(
            @Valid @RequestBody SavedQueryRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        SavedQueryResponse response = savedQueryService.create(user.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Get all saved queries for the current user")
    @GetMapping
    public ResponseEntity<List<SavedQueryResponse>> getAll(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        return ResponseEntity.ok(savedQueryService.getAll(user.getId()));
    }

    @Operation(summary = "Update an existing saved query")
    @PutMapping("/{id}")
    public ResponseEntity<SavedQueryResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody SavedQueryRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        SavedQueryResponse response = savedQueryService.update(id, user.getId(), request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Delete a saved query")
    @ApiResponse(responseCode = "204", description = "Query deleted")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        savedQueryService.delete(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    private User getCurrentUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
