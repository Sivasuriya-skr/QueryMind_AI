package com.querymind.querymind_ai.repository;

import com.querymind.querymind_ai.entity.DatabaseConnection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DatabaseConnectionRepository extends JpaRepository<DatabaseConnection, Long> {

    List<DatabaseConnection> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<DatabaseConnection> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndConnectionName(Long userId, String connectionName);

}
