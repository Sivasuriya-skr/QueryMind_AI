package com.querymind.querymind_ai.repository;

import com.querymind.querymind_ai.entity.QueryHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface QueryHistoryRepository extends JpaRepository<QueryHistory, Long> {
    Page<QueryHistory> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<QueryHistory> findByUserIdAndConnectionIdOrderByCreatedAtDesc(Long userId, Long connectionId, Pageable pageable);

    Page<QueryHistory> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, QueryHistory.QueryStatus status, Pageable pageable);

    Page<QueryHistory> findByUserIdAndCreatedAtBetweenOrderByCreatedAtDesc(Long userId, LocalDateTime from, LocalDateTime to, Pageable pageable);

    Page<QueryHistory> findByUserIdAndConnectionIdAndStatusOrderByCreatedAtDesc(Long userId, Long connectionId, QueryHistory.QueryStatus status, Pageable pageable);

    Optional<QueryHistory> findByIdAndUserId(Long id, Long userId);
}
