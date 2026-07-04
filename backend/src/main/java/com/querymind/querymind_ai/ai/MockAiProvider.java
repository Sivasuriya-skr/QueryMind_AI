package com.querymind.querymind_ai.ai;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@ConditionalOnProperty(name = "app.ai.provider", havingValue = "mock", matchIfMissing = true)
public class MockAiProvider implements AiProvider {

    private static final Map<String, String> PATTERNS = new ConcurrentHashMap<>();

    static {
        PATTERNS.put("all employees", "SELECT * FROM employees");
        PATTERNS.put("show.*employees", "SELECT * FROM employees");
        PATTERNS.put("select.*employees", "SELECT * FROM employees");
        PATTERNS.put("list.*employees", "SELECT id, name, email, department_id, salary, hire_date FROM employees");
        PATTERNS.put("employee.*name", "SELECT id, name, email FROM employees");
        PATTERNS.put("employee.*department", "SELECT e.name, d.name AS department " +
                "FROM employees e JOIN departments d ON e.department_id = d.id");
        PATTERNS.put("employee.*salary", "SELECT name, salary FROM employees ORDER BY salary DESC");
        PATTERNS.put("high.*salary|top.*earner|best.*paid",
                "SELECT name, salary FROM employees ORDER BY salary DESC LIMIT 10");
        PATTERNS.put("count.*employee|employee.*count|number.*employee",
                "SELECT COUNT(*) AS total_employees FROM employees");
        PATTERNS.put("joined.*last month|hired.*last month|new.*hire.*last month",
                "SELECT * FROM employees WHERE hire_date >= CURRENT_DATE - INTERVAL '1 month'");
        PATTERNS.put("joined.*2024|hired.*2024",
                "SELECT * FROM employees WHERE EXTRACT(YEAR FROM hire_date) = 2024");
        PATTERNS.put("department.*name|all department|list.*department",
                "SELECT id, name FROM departments");
        PATTERNS.put("employee.*per department|employee.*each department|count.*department",
                "SELECT d.name AS department, COUNT(e.id) AS employee_count " +
                "FROM departments d LEFT JOIN employees e ON d.id = e.department_id " +
                "GROUP BY d.id, d.name ORDER BY employee_count DESC");
        PATTERNS.put("average salary|avg.*salary|mean.*salary",
                "SELECT AVG(salary) AS average_salary FROM employees");
        PATTERNS.put("max.*salary|highest.*salary|maximum.*salary",
                "SELECT MAX(salary) AS highest_salary FROM employees");
        PATTERNS.put("min.*salary|lowest.*salary|minimum.*salary",
                "SELECT MIN(salary) AS lowest_salary FROM employees");
        PATTERNS.put("employee.*project|project.*assignment",
                "SELECT e.name, p.name AS project, pa.role " +
                "FROM employees e JOIN project_assignments pa ON e.id = pa.employee_id " +
                "JOIN projects p ON pa.project_id = p.id");
        PATTERNS.put("project.*budget|budget.*project",
                "SELECT name, budget FROM projects ORDER BY budget DESC");
    }

    @Override
    public String generate(String systemPrompt, String userMessage) {
        String lower = userMessage.toLowerCase();

        for (Map.Entry<String, String> entry : PATTERNS.entrySet()) {
            if (lower.matches(".*" + entry.getKey() + ".*")) {
                String sql = entry.getValue();
                String explanation = "Generated based on schema pattern matching.";
                return sql + "\n---\n" + explanation;
            }
        }

        String sql = inferFromKeywords(lower);
        if (sql != null) {
            return sql + "\n---\nGenerated from keyword analysis.";
        }

        return "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'\n---\n" +
                "I could not find a specific match for your question. " +
                "Showing available tables as a fallback.";
    }

    private String inferFromKeywords(String lower) {
        if (lower.contains("show") || lower.contains("list") || lower.contains("get") || lower.contains("find")) {
            if (lower.contains("table") || lower.contains("schema")) {
                return "SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name";
            }
        }
        if (lower.contains("who") || lower.contains("people") || lower.contains("user") || lower.contains("person")) {
            return "SELECT * FROM employees LIMIT 100";
        }
        if (lower.contains("how many") || lower.contains("count") || lower.contains("total")) {
            return "SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = 'public'";
        }
        if (lower.contains("recent") || lower.contains("latest") || lower.contains("newest")) {
            return "SELECT relname FROM pg_class WHERE relkind = 'r' ORDER BY reltuples DESC LIMIT 10";
        }
        return null;
    }

}
