package com.internal.tasktracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.filter.ShallowEtagHeaderFilter;

/**
 * Spring Boot application entry point for the Task Tracker microservice.
 */
@SpringBootApplication
public class TaskTrackerApplication {

    public static void main(String[] args) {
        SpringApplication.run(TaskTrackerApplication.class, args);
    }

    /**
     * Fix (Bug #43 - Performance & Caching): Shallow ETag filter.
     * Computes MD5 hash digests on HTTP response bodies and sets the ETag header.
     * Clients sending `If-None-Match` receive HTTP 304 Not Modified, saving network bandwidth.
     */
    @Bean
    public ShallowEtagHeaderFilter shallowEtagHeaderFilter() {
        return new ShallowEtagHeaderFilter();
    }
}
