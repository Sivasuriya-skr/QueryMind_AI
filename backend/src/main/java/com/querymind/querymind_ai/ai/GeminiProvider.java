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
@ConditionalOnProperty(name = "app.ai.provider", havingValue = "gemini")
public class GeminiProvider implements AiProvider {

    private final RestTemplate restTemplate;
    private final String apiKey;
    private final String model;
    private final String apiUrl;

    public GeminiProvider(
            @Value("${app.ai.gemini.api-key:}") String apiKey,
            @Value("${app.ai.gemini.model:gemini-pro}") String model,
            @Value("${app.ai.gemini.api-url:https://generativelanguage.googleapis.com/v1beta}") String apiUrl) {
        this.restTemplate = new RestTemplate();
        this.apiKey = apiKey;
        this.model = model;
        this.apiUrl = apiUrl;
    }

    @Override
    public String generate(String systemPrompt, String userMessage) {
        if (apiKey.isEmpty()) {
            throw new IllegalStateException("Gemini API key not configured. Set app.ai.gemini.api-key");
        }

        String combined = systemPrompt + "\n\nUser question: " + userMessage;

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", combined)))
                ),
                "generationConfig", Map.of(
                        "temperature", 0.1,
                        "maxOutputTokens", 200
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    apiUrl + "/models/" + model + ":generateContent?key=" + apiKey,
                    request, Map.class);

            Map<String, Object> body = response.getBody();
            if (body == null || !body.containsKey("candidates")) {
                throw new RuntimeException("Invalid response from Gemini API");
            }

            List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
            if (candidates.isEmpty()) {
                throw new RuntimeException("No candidates returned from Gemini API");
            }

            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            return (String) parts.get(0).get("text");

        } catch (Exception e) {
            String msg = e.getMessage();
            if (msg == null || msg.isBlank()) {
                msg = "Unknown error (check backend logs)";
            }
            throw new RuntimeException("Gemini API call failed: " + msg, e);
        }
    }
}
