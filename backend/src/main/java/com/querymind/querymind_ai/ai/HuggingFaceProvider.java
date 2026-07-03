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
@ConditionalOnProperty(name = "app.ai.provider", havingValue = "huggingface")
public class HuggingFaceProvider implements AiProvider {

    private final RestTemplate restTemplate;
    private final String apiToken;
    private final String model;
    private final String apiUrl;

    public HuggingFaceProvider(
            @Value("${app.ai.huggingface.api-token:}") String apiToken,
            @Value("${app.ai.huggingface.model:defog/sqlcoder-7b-2}") String model,
            @Value("${app.ai.huggingface.api-url:https://api-inference.huggingface.co}") String apiUrl) {
        this.restTemplate = new RestTemplate();
        this.apiToken = apiToken;
        this.model = model;
        this.apiUrl = apiUrl;
    }

    @Override
    public String generate(String systemPrompt, String userMessage) {
        if (apiToken.isEmpty()) {
            throw new IllegalStateException("Hugging Face API token not configured. Set app.ai.huggingface.api-token");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiToken);

        String prompt = systemPrompt + "\n\nUser question: " + userMessage + "\n\nSQL:";

        Map<String, Object> requestBody = Map.of(
                "inputs", prompt,
                "parameters", Map.of(
                        "max_new_tokens", 200,
                        "temperature", 0.1,
                        "return_full_text", false
                )
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<List> response = restTemplate.postForEntity(
                    apiUrl + "/models/" + model, request, List.class);

            List<Map<String, Object>> body = response.getBody();
            if (body == null || body.isEmpty()) {
                throw new RuntimeException("Invalid response from Hugging Face API");
            }

            Object generated = body.get(0).get("generated_text");
            if (generated == null) {
                throw new RuntimeException("No generated_text in Hugging Face response");
            }

            return generated.toString().trim();

        } catch (Exception e) {
            throw new RuntimeException("Hugging Face API call failed: " + e.getMessage(), e);
        }
    }
}
