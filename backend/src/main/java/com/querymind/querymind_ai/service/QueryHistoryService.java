package com.querymind.querymind_ai.service;

import com.querymind.querymind_ai.dto.QueryHistoryResponse;
import com.querymind.querymind_ai.entity.QueryHistory;
import com.querymind.querymind_ai.entity.QueryHistory.QueryStatus;
import com.querymind.querymind_ai.repository.QueryHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Service
@RequiredArgsConstructor
public class QueryHistoryService {

    private final QueryHistoryRepository repository;

    public QueryHistory record(Long userId, Long connectionId, String naturalLanguageQuestion,
                               String generatedSql, String executedSql,
                               Long executionTimeMs, Integer rowCount, QueryStatus status) {
        QueryHistory entry = QueryHistory.builder()
                .userId(userId)
                .connectionId(connectionId)
                .naturalLanguageQuestion(naturalLanguageQuestion)
                .generatedSql(generatedSql)
                .executedSql(executedSql)
                .executionTimeMs(executionTimeMs)
                .rowCount(rowCount)
                .status(status)
                .build();
        return repository.save(entry);
    }

    public Page<QueryHistoryResponse> getHistory(Long userId, Long connectionId, String status,
                                                  LocalDate dateFrom, LocalDate dateTo,
                                                  int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<QueryHistory> entries;

        QueryStatus qs = null;
        if (status != null && !status.isBlank()) {
            try {
                qs = QueryStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                qs = null;
            }
        }

        if (connectionId != null && qs != null) {
            entries = repository.findByUserIdAndConnectionIdAndStatusOrderByCreatedAtDesc(
                    userId, connectionId, qs, pageable);
        } else if (connectionId != null) {
            entries = repository.findByUserIdAndConnectionIdOrderByCreatedAtDesc(userId, connectionId, pageable);
        } else if (qs != null) {
            entries = repository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, qs, pageable);
        } else if (dateFrom != null && dateTo != null) {
            entries = repository.findByUserIdAndCreatedAtBetweenOrderByCreatedAtDesc(
                    userId, dateFrom.atStartOfDay(), dateTo.atTime(LocalTime.MAX), pageable);
        } else {
            entries = repository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        }

        return entries.map(this::toResponse);
    }

    @Transactional
    public void deleteHistory(Long id, Long userId) {
        QueryHistory entry = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("History entry not found"));
        repository.delete(entry);
    }

    private QueryHistoryResponse toResponse(QueryHistory entity) {
        return QueryHistoryResponse.builder()
                .id(entity.getId())
                .connectionId(entity.getConnectionId())
                .naturalLanguageQuestion(entity.getNaturalLanguageQuestion())
                .generatedSql(entity.getGeneratedSql())
                .executedSql(entity.getExecutedSql())
                .executionTimeMs(entity.getExecutionTimeMs())
                .rowCount(entity.getRowCount())
                .status(entity.getStatus().name())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
