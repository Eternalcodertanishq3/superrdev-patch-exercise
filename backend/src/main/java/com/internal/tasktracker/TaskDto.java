package com.internal.tasktracker;

import java.time.LocalDateTime;

/**
 * Data Transfer Object (DTO) for Task entity.
 * Fix (Bug #13 - Production-Readiness): Decouples internal JPA entity schema from public API responses.
 * Prevents internal field exposure (e.g., raw Hibernate proxies) and protects backward-compatibility.
 */
public record TaskDto(
        Long id,
        String title,
        String description,
        TaskStatus status,
        String priority,
        boolean archived,
        String assignee,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static TaskDto fromEntity(Task t) {
        if (t == null) return null;
        return new TaskDto(
                t.getId(),
                t.getTitle(),
                t.getDescription(),
                t.getStatus(),
                t.getPriority(),
                t.isArchived(),
                t.getAssignee(),
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }
}
