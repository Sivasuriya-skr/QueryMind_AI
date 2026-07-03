package com.querymind.querymind_ai.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Component
@ConditionalOnProperty(name = "app.ai.provider", havingValue = "ollama")
public class OllamaProvider implements AiProvider {

    private final RestTemplate restTemplate;
    private final String model;
    private final String apiUrl;

    public OllamaProvider(
            @Value("${app.ai.ollama.model:llama3.2}") String model,
            @Value("${app.ai.ollama.api-url:http://localhost:11434}") String apiUrl) {
        this.restTemplate = new RestTemplate();
        this.model = model;
        this.apiUrl = apiUrl;
    }

    @Override
    public String generate(String systemPrompt, String userMessage) {
        String combined = systemPrompt + "\n\nUser question: " + userMessage;

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "prompt", combined,
                "stream", false,
                "options", Map.of("temperature", 0.1)
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody);
        request.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    apiUrl + "/api/generate", request, Map.class);

            Map<String, Object> body = response.getBody();
            if (body == null || !body.containsKey("response")) {
                throw new RuntimeException("Invalid response from Ollama API");
            }

            return (String) body.get("response");

        } catch (Exception e) {
            throw new RuntimeException("Ollama API call failed: " + e.getMessage(), e);
        }
    }

}
