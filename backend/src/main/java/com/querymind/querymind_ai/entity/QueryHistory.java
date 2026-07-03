package com.querymind.querymind_ai.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "query_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class QueryHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long connectionId;

    @Column(columnDefinition = "TEXT")
    private String naturalLanguageQuestion;

    @Column(columnDefinition = "TEXT")
    private String generatedSql;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String executedSql;

    private Long executionTimeMs;

    private Integer rowCount;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private QueryStatus status;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum QueryStatus {
        SUCCESS, FAILED, BLOCKED
    }
}
