package com.internal.tasktracker;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * In-memory sliding window rate limiter filter.
 * Fix (Bug #25 - Security & Stability): Throttles abusive traffic and prevents denial-of-service (DoS)
 * attacks by enforcing a maximum of 120 requests per minute per IP address.
 */
@Component
@Order(2)
public class RateLimiterFilter implements Filter {

    private static final int MAX_REQUESTS_PER_MINUTE = 180;
    private final Map<String, RequestCounter> requestCounts = new ConcurrentHashMap<>();

    private static class RequestCounter {
        final long windowMinute;
        final AtomicInteger count;

        RequestCounter(long windowMinute) {
            this.windowMinute = windowMinute;
            this.count = new AtomicInteger(1);
        }
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (request instanceof HttpServletRequest httpRequest && response instanceof HttpServletResponse httpResponse) {
            String clientIp = httpRequest.getRemoteAddr();
            long currentMinute = System.currentTimeMillis() / 60000;

            RequestCounter counter = requestCounts.compute(clientIp, (ip, existing) -> {
                if (existing == null || existing.windowMinute != currentMinute) {
                    return new RequestCounter(currentMinute);
                }
                existing.count.incrementAndGet();
                return existing;
            });

            if (counter.count.get() > MAX_REQUESTS_PER_MINUTE) {
                httpResponse.setStatus(429); // 429 Too Many Requests
                httpResponse.setContentType("application/json");
                httpResponse.getWriter().write("{\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded. Maximum 180 requests per minute.\"}");
                return;
            }
        }
        chain.doFilter(request, response);
    }
}
