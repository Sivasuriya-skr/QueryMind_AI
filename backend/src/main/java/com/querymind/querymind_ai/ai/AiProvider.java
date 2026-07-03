package com.querymind.querymind_ai.ai;

public interface AiProvider {

    String generate(String systemPrompt, String userMessage);

}
