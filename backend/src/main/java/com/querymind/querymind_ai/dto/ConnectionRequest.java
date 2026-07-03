package com.querymind.querymind_ai.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ConnectionRequest {

    @NotBlank(message = "Connection name is required")
    @Pattern(regexp = "^[a-zA-Z0-9\\s_-]+$", message = "Connection name can only contain letters, numbers, spaces, hyphens, and underscores")
    private String connectionName;

    @NotBlank(message = "Host is required")
    private String host;

    @Min(value = 1, message = "Port must be between 1 and 65535")
    @Max(value = 65535, message = "Port must be between 1 and 65535")
    private int port;

    @NotBlank(message = "Database name is required")
    private String databaseName;

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Password is required")
    private String password;

}
