package com.querymind.querymind_ai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class QuerymindAiApplication {

    public static void main(String[] args) {
        SpringApplication.run(QuerymindAiApplication.class, args);
    }

}
