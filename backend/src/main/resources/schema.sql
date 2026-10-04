-- Fix (Bug #28 & Bug #29 - Production-Readiness):
-- 1. Bug #28: Added CHECK constraints on `status` and `priority` to protect database data integrity against corrupt values.
-- 2. Bug #29: Added `updated_at` modification timestamp to support auditing, caching, and optimistic locking.
CREATE TABLE IF NOT EXISTS tasks (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(255)  NOT NULL,
    description VARCHAR(1000),
    status      VARCHAR(20)   NOT NULL CHECK (status IN ('OPEN', 'IN_PROGRESS', 'DONE')),
    priority    VARCHAR(10)   DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    archived    BOOLEAN       DEFAULT FALSE,
    assignee    VARCHAR(100),
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- Fix (Bug #2): Added database indexes for fast filtering and ordering.
-- Previously, queries on `status` or `(archived, created_at)` performed full table scans and expensive disk/memory filesorts.
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_archived_created ON tasks(archived, created_at DESC);
