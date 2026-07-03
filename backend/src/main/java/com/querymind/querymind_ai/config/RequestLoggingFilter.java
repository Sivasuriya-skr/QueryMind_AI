package com.querymind.querymind_ai.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.security.Principal;
import java.time.Duration;
import java.time.Instant;

@Component
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        Instant start = Instant.now();

        try {
            filterChain.doFilter(request, response);
        } finally {
            long elapsed = Duration.between(start, Instant.now()).toMillis();
            Principal principal = request.getUserPrincipal();
            String user = principal != null ? principal.getName() : "anonymous";
            int status = response.getStatus();

            log.info("method={} path={} status={} user={} duration={}ms",
                    request.getMethod(), request.getRequestURI(), status, user, elapsed);
        }
    }
}
