package com.querymind.querymind_ai.repository;

import com.querymind.querymind_ai.entity.SavedQuery;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavedQueryRepository extends JpaRepository<SavedQuery, Long> {
    List<SavedQuery> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<SavedQuery> findByIdAndUserId(Long id, Long userId);
}
