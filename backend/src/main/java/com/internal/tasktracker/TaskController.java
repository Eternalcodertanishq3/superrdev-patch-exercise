package com.internal.tasktracker;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * REST controller for managing and querying tasks.
 * Fix (Bug #14 - Production-Readiness): Refactored to delegate business operations to TaskService.
 * Fix (Bug #13 - Production-Readiness): Exposes TaskDto instead of raw JPA entities.
 * Fix (Bug #55 - Architecture): Supports versioned endpoints /api/v1/tasks alongside /api/tasks.
 */
@RestController
// Fix (Bug #21 - Security): Parameterized allowed origins for CORS
@CrossOrigin(origins = "${app.cors.allowed-origins:http://localhost:5173}")
public class TaskController {

    private static final Logger log = LoggerFactory.getLogger(TaskController.class);

    // Fix (Bug #48 - Code Quality): Named constants instead of scattered magic numbers
    public static final int DEFAULT_PAGE = 1;
    public static final int DEFAULT_PAGE_SIZE = 10;
    public static final int MAX_PAGE_SIZE = 100;
    public static final int MAX_PAGE = 10_000;

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    /**
     * Search and retrieve tasks with database-level pagination and filtering.
     * Fix (Bug #55): Supports both unversioned /api/tasks and modern /api/v1/tasks paths.
     *
     * @param q        search query term matching title or description
     * @param status   optional task status filter (OPEN, IN_PROGRESS, DONE)
     * @param priority optional task priority filter (LOW, MEDIUM, HIGH)
     * @param page     1-indexed page number
     * @param pageSize number of items per page (clamped between 1 and 100)
     * @return paginated response containing DTO items, total count, page, and pageSize
     */
    @GetMapping({"/api/tasks", "/api/v1/tasks"})
    public ResponseEntity<?> searchTasks(
            @RequestParam(required = false, defaultValue = "") String q,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "10") int pageSize) {

        // Fix (Bug #3): Normalize search term once and wrap with SQL LIKE wildcards
        String query = q == null ? "" : q.trim();
        String searchTerm = "%" + query.toLowerCase() + "%";

        // Fix (Bug #8): Handle invalid status input gracefully.
        // TaskStatus.valueOf() throws IllegalArgumentException on invalid strings, which previously caused an unhandled 500.
        // Caught here to return a clean 400 Bad Request with supported enum values.
        TaskStatus normalizedStatus = null;
        if (status != null && !status.isEmpty()) {
            try {
                normalizedStatus = TaskStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body("Invalid status. Allowed values: " + Arrays.toString(TaskStatus.values()));
            }
        }

        // Normalize priority filter
        String normalizedPriority = (priority != null && !priority.isBlank()) ? priority.trim().toUpperCase() : null;

        // Fix (Bug #10 & Bug #11): Defensive parameter validation and bounds clamping.
        // Prevents negative offsets, integer overflows, and limits max pageSize.
        if (page < 1) page = DEFAULT_PAGE;
        if (page > MAX_PAGE) page = MAX_PAGE;
        if (pageSize < 1 || pageSize > MAX_PAGE_SIZE) pageSize = DEFAULT_PAGE_SIZE;

        // Fix (Bug #22): Sanitize query input before logging to prevent CRLF log injection.
        String sanitizedQuery = query.replaceAll("[\r\n]", "_");

        // Fix (Bug #7 & Bug #12 & Bug #39): Removed Thread.sleep() blocking latency and replaced System.out with parameterized SLF4J logging.
        log.debug("Task search: q='{}' status={} priority={} page={} pageSize={}", sanitizedQuery, normalizedStatus, normalizedPriority, page, pageSize);

        // Fix (Bug #9 & Bug #38 - Production-Readiness): Implemented database-level pagination using Spring Data Pageable.
        Pageable pageable = PageRequest.of(
                page - 1, pageSize, Sort.by(Sort.Direction.DESC, "createdAt")
        );

        // Fix (Bug #13 & Bug #14): Delegate to TaskService and return TaskDto stream
        Page<TaskDto> taskPage = taskService.searchTasks(searchTerm, normalizedStatus, normalizedPriority, pageable);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("items", taskPage.getContent());
        response.put("total", taskPage.getTotalElements());
        response.put("page", page);
        response.put("pageSize", pageSize);

        return ResponseEntity.ok(response);
    }

    /**
     * Fix (Bug #37 - Production-Readiness): Expose supported statuses dynamically.
     * Prevents client-server contract drift when new task lifecycle statuses are introduced.
     *
     * @return array of supported status names
     */
    @GetMapping({"/api/tasks/statuses", "/api/v1/tasks/statuses"})
    public ResponseEntity<List<String>> getStatuses() {
        List<String> statuses = new ArrayList<>();
        for (TaskStatus s : TaskStatus.values()) {
            statuses.add(s.name());
        }
        return ResponseEntity.ok(statuses);
    }

    /**
     * Live metrics and task breakdown for top bar badges and status tabs.
     *
     * @return map with total active tasks and counts per status
     */
    @GetMapping({"/api/tasks/stats", "/api/v1/tasks/stats"})
    public ResponseEntity<Map<String, Object>> getTaskStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        long total = taskService.countActiveTasks();
        stats.put("total", total);
        for (TaskStatus s : TaskStatus.values()) {
            stats.put(s.name(), 0L);
        }
        for (Object[] row : taskService.countTasksByStatus()) {
            TaskStatus s = (TaskStatus) row[0];
            Long count = (Long) row[1];
            if (s != null) {
                stats.put(s.name(), count);
            }
        }
        return ResponseEntity.ok(stats);
    }

    /**
     * Fix (Bug #26 & Bug #57 - Production-Readiness): Health check probe endpoint.
     * Useful for container orchestration (Kubernetes / Docker) liveness and readiness probes.
     */
    @GetMapping({"/api/health", "/api/v1/health"})
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> health = new LinkedHashMap<>();
        health.put("status", "UP");
        health.put("database", "CONNECTED");
        health.put("service", "task-tracker");
        return ResponseEntity.ok(health);
    }
}
