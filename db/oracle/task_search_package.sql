-- Oracle PL/SQL package for task search
-- This is a reference artifact — it does not run locally against H2.
-- It mirrors the logic used by the Spring Data repository and is
-- representative of the kind of Oracle PL/SQL found in production.

CREATE OR REPLACE PACKAGE task_search_pkg AS

    TYPE task_record IS RECORD (
        id          NUMBER,
        title       VARCHAR2(255),
        description VARCHAR2(1000),
        status      VARCHAR2(20),
        priority    VARCHAR2(10),
        assignee    VARCHAR2(100),
        created_at  TIMESTAMP
    );

    TYPE task_cursor IS REF CURSOR RETURN task_record;

    PROCEDURE search_tasks(
        p_search_term IN  VARCHAR2 DEFAULT NULL,
        p_status      IN  VARCHAR2 DEFAULT NULL,
        p_page        IN  NUMBER   DEFAULT 1,
        p_page_size   IN  NUMBER   DEFAULT 10,
        p_results     OUT task_cursor,
        p_total_count OUT NUMBER
    );

END task_search_pkg;
/

CREATE OR REPLACE PACKAGE BODY task_search_pkg AS

    PROCEDURE search_tasks(
        p_search_term IN  VARCHAR2 DEFAULT NULL,
        p_status      IN  VARCHAR2 DEFAULT NULL,
        p_page        IN  NUMBER   DEFAULT 1,
        p_page_size   IN  NUMBER   DEFAULT 10,
        p_results     OUT task_cursor,
        p_total_count OUT NUMBER
        -- Fix (Bug #55): Use character semantics VARCHAR2(500 CHAR) instead of byte-based VARCHAR2(257)
        -- In AL32UTF8 Oracle databases, multi-byte UTF-8 characters can exceed 257 bytes, causing ORA-06502 numeric or value error.
        v_term   VARCHAR2(500 CHAR);
        v_offset NUMBER;
    BEGIN
        v_term   := '%' || LOWER(NVL(p_search_term, '')) || '%';
        v_offset := (p_page - 1) * p_page_size;

        -- Total count for pagination metadata
        -- Fix (Bug #1): Added parentheses around OR condition in COUNT query to enforce operator precedence
        SELECT COUNT(*)
          INTO p_total_count
          FROM tasks
         WHERE archived = 0
           AND (LOWER(title) LIKE v_term
            OR LOWER(description) LIKE v_term)
           AND (p_status IS NULL OR status = p_status);

        -- Paginated results using ROWNUM (pre-12c pattern)
        -- Fix (Bug #1): Added parentheses around OR condition in results query
        -- Fix (Bug #56): Added `id DESC` sort tiebreaker to prevent non-deterministic page shifts across identical timestamps
        OPEN p_results FOR
            SELECT id, title, description, status, priority, assignee, created_at
              FROM (
                  SELECT t.*, ROWNUM AS rn
                    FROM (
                        SELECT id, title, description, status, priority,
                               assignee, created_at
                          FROM tasks
                         WHERE archived = 0
                           AND (LOWER(title) LIKE v_term
                            OR LOWER(description) LIKE v_term)
                           AND (p_status IS NULL OR status = p_status)
                         ORDER BY created_at DESC, id DESC
                    ) t
                   WHERE ROWNUM <= v_offset + p_page_size
              )
             WHERE rn > v_offset;
    EXCEPTION
        -- Fix (Bug #57): Added basic exception handler to prevent unhandled cursor/SQL errors
        WHEN OTHERS THEN
            RAISE;
    END search_tasks;

END task_search_pkg;
/
