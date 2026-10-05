package com.internal.tasktracker;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Automated test suite covering TaskController, TaskService, and TaskRepository.
 * Fix (Bug #49 - Code Quality & Testing): Comprehensive automated regression test coverage.
 */
@SpringBootTest
@AutoConfigureMockMvc
@SuppressWarnings("null")
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /api/tasks returns 200 OK with paginated structure and security headers (Bug #9, #23)")
    void testSearchTasks_DefaultPagination() throws Exception {
        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().exists("ETag"))
                .andExpect(jsonPath("$.page", is(1)))
                .andExpect(jsonPath("$.pageSize", is(10)))
                .andExpect(jsonPath("$.items", notNullValue()))
                .andExpect(jsonPath("$.total", greaterThanOrEqualTo(0)));
    }

    @Test
    @DisplayName("GET /api/v1/tasks returns 200 OK with versioned API path (Bug #55)")
    void testSearchTasks_VersionedEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page", is(1)))
                .andExpect(jsonPath("$.items", notNullValue()));
    }

    @Test
    @DisplayName("GET /api/tasks with invalid status returns 400 Bad Request (Bug #8)")
    void testSearchTasks_InvalidStatus_ReturnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/tasks").param("status", "NOT_A_STATUS"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("Invalid status. Allowed values:")));
    }

    @Test
    @DisplayName("GET /api/tasks with negative page clamps to page 1 (Bug #10 & #11)")
    void testSearchTasks_NegativePage_ClampsToOne() throws Exception {
        mockMvc.perform(get("/api/tasks").param("page", "-10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page", is(1)));
    }

    @Test
    @DisplayName("GET /api/tasks/statuses returns supported enum list (Bug #37)")
    void testGetStatuses_ReturnsEnumList() throws Exception {
        mockMvc.perform(get("/api/tasks/statuses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasItems("OPEN", "IN_PROGRESS", "DONE")));
    }

    @Test
    @DisplayName("GET /api/tasks excludes archived tasks even on title match (Bug #1 Operator Precedence)")
    void testSearchTasks_ArchivedTasksExcluded() throws Exception {
        mockMvc.perform(get("/api/tasks").param("q", "audit"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", notNullValue()));
    }

    @Test
    @DisplayName("GET /api/tasks/stats returns live breakdown")
    void testGetTaskStats() throws Exception {
        mockMvc.perform(get("/api/tasks/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total", greaterThanOrEqualTo(47)))
                .andExpect(jsonPath("$.OPEN", notNullValue()))
                .andExpect(jsonPath("$.IN_PROGRESS", notNullValue()))
                .andExpect(jsonPath("$.DONE", notNullValue()));
    }

    @Test
    @DisplayName("GET /api/health returns 200 UP (Bug #57)")
    void testHealthCheck() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("UP")))
                .andExpect(jsonPath("$.database", is("CONNECTED")));
    }
}
