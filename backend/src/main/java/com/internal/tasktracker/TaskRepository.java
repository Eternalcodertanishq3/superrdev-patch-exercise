package com.internal.tasktracker;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    // Fix (Bug #1, Bug #12 & Bug #26):
    // 1. Bug #1: Fixed SQL operator precedence bug by adding explicit parentheses around the (OR) condition.
    //    Previously, `AND` bound tighter than `OR`, causing archived tasks to leak through and bypassing status filters.
    // 2. Bug #12 (Production-Readiness): Migrated from native SQL to Spring Data JPQL with Pageable to execute
    //    database-level LIMIT/OFFSET pagination, preventing full table heap allocations.
    // 3. Bug #26 (Production-Readiness): Marked as read-only transaction to optimize Hibernate dirty-checking.
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    @Query("SELECT t FROM Task t WHERE t.archived = false AND (LOWER(t.title) LIKE :term OR LOWER(t.description) LIKE :term) AND (:status IS NULL OR t.status = :status) AND (:priority IS NULL OR t.priority = :priority)")
    org.springframework.data.domain.Page<Task> searchTasks(
            @Param("term") String term,
            @Param("status") TaskStatus status,
            @Param("priority") String priority,
            org.springframework.data.domain.Pageable pageable);

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    @Query("SELECT t FROM Task t WHERE t.archived = false AND (LOWER(t.title) LIKE :term OR LOWER(t.description) LIKE :term) AND (:status IS NULL OR t.status = :status)")
    org.springframework.data.domain.Page<Task> searchTasks(
            @Param("term") String term,
            @Param("status") TaskStatus status,
            org.springframework.data.domain.Pageable pageable);

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    @Query("SELECT t.status, COUNT(t) FROM Task t WHERE t.archived = false GROUP BY t.status")
    List<Object[]> countTasksByStatus();

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    long countByArchivedFalse();
}
