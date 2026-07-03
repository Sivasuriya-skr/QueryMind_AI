package com.querymind.querymind_ai.dto;

import java.util.List;

public record SchemaTableInfo(
    String name,
    List<SchemaColumnInfo> columns
) {}
