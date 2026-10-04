package com.internal.tasktracker;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * JPA entity representing a task in the Task Tracker domain.
 * Maps to database table `tasks`.
 */
@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;

    // Fix (Bug #27 - Production-Readiness): Strongly-typed TaskStatus enum representation.
    // Storing status as an untyped String allowed corrupt values; @Enumerated(EnumType.STRING) enforces schema safety.
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status;

    @Column
    private String priority;

    @Column(nullable = false)
    private boolean archived;

    @Column
    private String assignee;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Fix (Bug #29 - Production-Readiness): Added audit timestamp for record modifications.
    // Facilitates optimistic locking, audit tracking, and cache invalidation.
    @org.hibernate.annotations.UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public boolean isArchived() { return archived; }
    public void setArchived(boolean archived) { this.archived = archived; }

    public String getAssignee() { return assignee; }
    public void setAssignee(String assignee) { this.assignee = assignee; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = TaskStatus.OPEN;
        }
        if (priority == null || priority.isBlank()) {
            priority = "MEDIUM";
        }
    }

    // Fix (Bug #31 - Production-Readiness): Implemented equals() and hashCode() based on persistent id.
    // Default Object identity failed across detached Hibernate sessions and inside HashSets/HashMaps.
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Task task = (Task) o;
        return id != null && id.equals(task.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
