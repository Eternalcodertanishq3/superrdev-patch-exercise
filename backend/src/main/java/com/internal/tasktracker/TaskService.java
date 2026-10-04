package com.internal.tasktracker;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service layer encapsulating task business operations and queries.
 * Fix (Bug #14 - Production-Readiness): Introduces service boundary, decoupling TaskController
 * from direct database access in TaskRepository for clean separation of concerns.
 */
@Service
@Transactional(readOnly = true)
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    /**
     * Search and retrieve tasks with database-level pagination and filtering, mapping entities to DTOs.
     */
    public Page<TaskDto> searchTasks(String searchTerm, TaskStatus status, String priority, Pageable pageable) {
        Page<Task> taskPage = (priority != null)
                ? taskRepository.searchTasks(searchTerm, status, priority, pageable)
                : taskRepository.searchTasks(searchTerm, status, pageable);
        return taskPage.map(TaskDto::fromEntity);
    }

    /**
     * Get count of all active (non-archived) tasks.
     */
    public long countActiveTasks() {
        return taskRepository.countByArchivedFalse();
    }

    /**
     * Get aggregated counts of active tasks grouped by status.
     */
    public List<Object[]> countTasksByStatus() {
        return taskRepository.countTasksByStatus();
    }
}
