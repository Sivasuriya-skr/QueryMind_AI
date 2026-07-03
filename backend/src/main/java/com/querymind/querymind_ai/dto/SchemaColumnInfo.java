package com.querymind.querymind_ai.dto;

public record SchemaColumnInfo(
    String name,
    String type,
    boolean nullable,
    boolean primaryKey,
    String foreignKey
) {}
