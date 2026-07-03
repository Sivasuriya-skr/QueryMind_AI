package com.querymind.querymind_ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConnectionResponse {

    private Long id;
    private String connectionName;
    private String host;
    private int port;
    private String databaseName;
    private String username;
    private LocalDateTime createdAt;

}
