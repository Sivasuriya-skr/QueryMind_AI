-- ============================================
-- Sample Data for QueryMind AI (PostgreSQL)
-- ============================================
-- Password for test users: password123
-- Run this AFTER the backend has started once
-- (tables must already exist)

-- 1. Sample Users
INSERT INTO users (name, email, password, role, created_at)
VALUES
  ('Alice Johnson', 'alice@example.com', '$2b$12$vDAH1AFIfttc8pXAkkDEfOYiqeJTew9BM/dSYF/KkzLpeqhAe1XPq', 'USER', NOW()),
  ('Bob Smith', 'bob@example.com', '$2b$12$vDAH1AFIfttc8pXAkkDEfOYiqeJTew9BM/dSYF/KkzLpeqhAe1XPq', 'USER', NOW());

-- 2. Sample Database Connections
INSERT INTO database_connections (user_id, connection_name, host, port, database_name, username, password, created_at)
VALUES
  (1, 'Production DB', 'db.company.com', 5432, 'proddb', 'admin', 'encrypted_pass', NOW()),
  (1, 'Staging DB', 'staging.db.company.com', 5432, 'stagingdb', 'devuser', 'encrypted_pass', NOW()),
  (2, 'Analytics DB', 'analytics.db.company.com', 5432, 'analytics', 'analyst', 'encrypted_pass', NOW());

-- 3. Sample Query History (user 1, connection 1)
INSERT INTO query_history (user_id, connection_id, natural_language_question, generated_sql, executed_sql, execution_time_ms, row_count, status, created_at)
VALUES
  (1, 1, 'Show me all users who signed up last month',
   'SELECT * FROM users WHERE created_at >= date_trunc(''month'', CURRENT_DATE - INTERVAL ''1 month'') AND created_at < date_trunc(''month'', CURRENT_DATE);',
   'SELECT * FROM users WHERE created_at >= date_trunc(''month'', CURRENT_DATE - INTERVAL ''1 month'') AND created_at < date_trunc(''month'', CURRENT_DATE);',
   45, 128, 'SUCCESS', NOW() - INTERVAL '1 hour'),

  (1, 1, 'What are our top 10 products by revenue?',
   'SELECT p.name, SUM(oi.quantity * oi.unit_price) AS revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.id, p.name ORDER BY revenue DESC LIMIT 10;',
   'SELECT p.name, SUM(oi.quantity * oi.unit_price) AS revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.id, p.name ORDER BY revenue DESC LIMIT 10;',
   120, 10, 'SUCCESS', NOW() - INTERVAL '2 hours'),

  (1, 1, 'How many orders were placed yesterday?',
   'SELECT COUNT(*) FROM orders WHERE order_date >= CURRENT_DATE - INTERVAL ''1 day'' AND order_date < CURRENT_DATE;',
   'SELECT COUNT(*) FROM orders WHERE order_date >= CURRENT_DATE - INTERVAL ''1 day'' AND order_date < CURRENT_DATE;',
   15, 1, 'SUCCESS', NOW() - INTERVAL '3 hours'),

  (1, 1, 'List all customers in New York',
   'SELECT * FROM customers WHERE city = ''New York'';',
   'SELECT * FROM customers WHERE city = ''New York'';',
   30, 245, 'SUCCESS', NOW() - INTERVAL '1 day'),

  (2, 3, 'Show me daily active users for the past week',
   'SELECT DATE(login_date) AS day, COUNT(DISTINCT user_id) AS dau FROM user_logins WHERE login_date >= CURRENT_DATE - INTERVAL ''7 days'' GROUP BY DATE(login_date) ORDER BY day;',
   'SELECT DATE(login_date) AS day, COUNT(DISTINCT user_id) AS dau FROM user_logins WHERE login_date >= CURRENT_DATE - INTERVAL ''7 days'' GROUP BY DATE(login_date) ORDER BY day;',
   200, 7, 'SUCCESS', NOW() - INTERVAL '30 minutes'),

  (1, 1, 'Get all tables in the database',
   'SELECT table_name FROM information_schema.tables WHERE table_schema = ''public'';',
   'SELECT table_name FROM information_schema.tables WHERE table_schema = ''public'';',
   5, 15, 'SUCCESS', NOW() - INTERVAL '4 hours'),

  (1, 1, 'What is the average order value?',
   'SELECT AVG(total_amount) FROM orders;',
   'SELECT AVG(total_amount) FROM orders;',
   80, 1, 'SUCCESS', NOW() - INTERVAL '5 hours'),

  (1, 2, 'Find employees hired in 2023',
   'SELECT * FROM employees WHERE EXTRACT(YEAR FROM hire_date) = 2023;',
   'SELECT * FROM employees WHERE EXTRACT(YEAR FROM hire_date) = 2023;',
   60, 12, 'SUCCESS', NOW() - INTERVAL '6 hours');

-- 4. Sample Saved Queries
INSERT INTO saved_queries (user_id, connection_id, title, query_sql, description, created_at)
VALUES
  (1, 1, 'Monthly Active Users', 'SELECT DATE_TRUNC(''month'', login_date) AS month, COUNT(DISTINCT user_id) AS mau FROM user_logins GROUP BY month ORDER BY month DESC;', 'Monthly active user count for the dashboard', NOW() - INTERVAL '2 days'),
  (1, 1, 'Top Products by Revenue', 'SELECT p.name, SUM(oi.quantity * oi.unit_price) AS revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.id, p.name ORDER BY revenue DESC LIMIT 10;', 'Top 10 revenue-generating products', NOW() - INTERVAL '3 days'),
  (1, 1, 'New Users This Month', 'SELECT * FROM users WHERE created_at >= DATE_TRUNC(''month'', CURRENT_DATE);', 'All users who registered this month', NOW() - INTERVAL '4 days'),
  (2, 3, 'Daily Active Users (7 days)', 'SELECT DATE(login_date) AS day, COUNT(DISTINCT user_id) AS dau FROM user_logins WHERE login_date >= CURRENT_DATE - INTERVAL ''7 days'' GROUP BY day ORDER BY day;', 'DAU for the past week', NOW() - INTERVAL '1 day');
