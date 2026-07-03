package com.querymind.querymind_ai.service;

import com.querymind.querymind_ai.dto.SavedQueryRequest;
import com.querymind.querymind_ai.dto.SavedQueryResponse;
import com.querymind.querymind_ai.entity.SavedQuery;
import com.querymind.querymind_ai.repository.SavedQueryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SavedQueryService {

    private final SavedQueryRepository repository;

    public SavedQueryResponse create(Long userId, SavedQueryRequest request) {
        SavedQuery entity = SavedQuery.builder()
                .userId(userId)
                .connectionId(request.getConnectionId())
                .title(request.getTitle())
                .querySql(request.getSql())
                .description(request.getDescription())
                .build();
        entity = repository.save(entity);
        return toResponse(entity);
    }

    public List<SavedQueryResponse> getAll(Long userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public SavedQueryResponse update(Long id, Long userId, SavedQueryRequest request) {
        SavedQuery entity = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Saved query not found"));
        entity.setTitle(request.getTitle());
        entity.setQuerySql(request.getSql());
        entity.setDescription(request.getDescription());
        entity.setConnectionId(request.getConnectionId());
        entity = repository.save(entity);
        return toResponse(entity);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        SavedQuery entity = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Saved query not found"));
        repository.delete(entity);
    }

    private SavedQueryResponse toResponse(SavedQuery entity) {
        return SavedQueryResponse.builder()
                .id(entity.getId())
                .connectionId(entity.getConnectionId())
                .title(entity.getTitle())
                .sql(entity.getQuerySql())
                .description(entity.getDescription())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
