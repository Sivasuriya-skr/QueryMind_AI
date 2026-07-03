package com.querymind.querymind_ai.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Component
@ConditionalOnProperty(name = "app.ai.provider", havingValue = "openai")
public class OpenAiProvider implements AiProvider {

    private final RestTemplate restTemplate;
    private final String apiKey;
    private final String model;
    private final String apiUrl;

    public OpenAiProvider(
            @Value("${app.ai.openai.api-key:}") String apiKey,
            @Value("${app.ai.openai.model:gpt-4o-mini}") String model,
            @Value("${app.ai.openai.api-url:https://api.openai.com/v1}") String apiUrl) {
        this.restTemplate = new RestTemplate();
        this.apiKey = apiKey;
        this.model = model;
        this.apiUrl = apiUrl;
    }

    @Override
    public String generate(String systemPrompt, String userMessage) {
        if (apiKey.isEmpty()) {
            throw new IllegalStateException("OpenAI API key not configured. Set app.ai.openai.api-key");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userMessage)
                ),
                "temperature", 0.1
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    apiUrl + "/chat/completions", request, Map.class);

            Map<String, Object> body = response.getBody();
            if (body == null || !body.containsKey("choices")) {
                throw new RuntimeException("Invalid response from OpenAI API");
            }

            List<Map<String, Object>> choices = (List<Map<String, Object>>) body.get("choices");
            if (choices.isEmpty()) {
                throw new RuntimeException("No choices returned from OpenAI API");
            }

            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            return (String) message.get("content");

        } catch (Exception e) {
            throw new RuntimeException("OpenAI API call failed: " + e.getMessage(), e);
        }
    }

}
