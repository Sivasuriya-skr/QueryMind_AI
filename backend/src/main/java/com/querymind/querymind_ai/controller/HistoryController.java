package com.querymind.querymind_ai.controller;

import com.querymind.querymind_ai.dto.QueryHistoryResponse;
import com.querymind.querymind_ai.entity.User;
import com.querymind.querymind_ai.repository.UserRepository;
import com.querymind.querymind_ai.service.QueryHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
@Tag(name = "History", description = "Query execution history")
public class HistoryController {

    private final QueryHistoryService historyService;
    private final UserRepository userRepository;

    @Operation(summary = "Get paginated query history with optional filters")
    @GetMapping
    public ResponseEntity<Page<QueryHistoryResponse>> getHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Long connectionId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) LocalDate dateFrom,
            @RequestParam(required = false) LocalDate dateTo,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        Page<QueryHistoryResponse> result = historyService.getHistory(
                user.getId(), connectionId, status, dateFrom, dateTo, page, size);
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "Delete a history entry")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHistory(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        historyService.deleteHistory(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    private User getCurrentUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
