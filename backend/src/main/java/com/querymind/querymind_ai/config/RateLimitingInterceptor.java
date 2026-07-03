package com.querymind.querymind_ai.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(RateLimitingInterceptor.class);

    private final Map<String, long[]> requestCounts = new ConcurrentHashMap<>();
    private final int maxRequests;
    private final long windowMs;

    public RateLimitingInterceptor(
            @Value("${app.rate-limit.max-requests:10}") int maxRequests,
            @Value("${app.rate-limit.window-seconds:60}") int windowSeconds) {
        this.maxRequests = maxRequests;
        this.windowMs = windowSeconds * 1000L;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                             Object handler) throws Exception {
        String path = request.getRequestURI();
        if (!isAiEndpoint(path)) {
            return true;
        }

        String user = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : "anonymous";
        String key = user + ":" + extractEndpoint(path);

        long now = System.currentTimeMillis();
        long[] window = requestCounts.compute(key, (k, v) -> {
            if (v == null || now - v[0] > windowMs) {
                return new long[]{now, 1};
            }
            v[1]++;
            return v;
        });

        if (window[1] > maxRequests) {
            log.warn("Rate limit exceeded for user={} endpoint={}", user, extractEndpoint(path));
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"timestamp\":\"" + java.time.LocalDateTime.now() + "\"," +
                    "\"status\":429," +
                    "\"error\":\"Too Many Requests\"," +
                    "\"message\":\"Rate limit exceeded. Try again later.\"," +
                    "\"path\":\"" + path + "\"}");
            return false;
        }

        return true;
    }

    private boolean isAiEndpoint(String path) {
        return path.contains("/generate-sql") || path.contains("/explain-sql")
                || path.contains("/optimize-sql") || path.contains("/execution-plan");
    }

    private String extractEndpoint(String path) {
        if (path.contains("/generate-sql")) return "generate-sql";
        if (path.contains("/explain-sql")) return "explain-sql";
        if (path.contains("/optimize-sql")) return "optimize-sql";
        if (path.contains("/execution-plan")) return "execution-plan";
        return "unknown";
    }
}
