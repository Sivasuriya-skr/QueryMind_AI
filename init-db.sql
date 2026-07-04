CREATE DATABASE sample_company;

\c sample_company;

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    budget NUMERIC(12,2)
);

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    department_id INTEGER REFERENCES departments(id),
    salary NUMERIC(10,2),
    hire_date DATE,
    is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO departments (name, location, budget) VALUES
    ('Engineering', 'New York', 500000.00),
    ('Marketing', 'San Francisco', 300000.00),
    ('Sales', 'Chicago', 400000.00),
    ('HR', 'New York', 150000.00),
    ('Finance', 'Boston', 250000.00);

INSERT INTO employees (name, email, department_id, salary, hire_date, is_active) VALUES
    ('John Doe', 'john@company.com', 1, 95000.00, '2022-03-15', TRUE),
    ('Jane Smith', 'jane@company.com', 1, 110000.00, '2021-07-01', TRUE),
    ('Bob Wilson', 'bob@company.com', 2, 75000.00, '2023-01-10', TRUE),
    ('Alice Brown', 'alice@company.com', 2, 82000.00, '2022-11-20', TRUE),
    ('Charlie Davis', 'charlie@company.com', 3, 65000.00, '2024-02-01', TRUE),
    ('Diana Lee', 'diana@company.com', 3, 70000.00, '2023-06-15', TRUE),
    ('Eve Martin', 'eve@company.com', 4, 60000.00, '2021-09-01', TRUE),
    ('Frank Thomas', 'frank@company.com', 4, 58000.00, '2022-04-10', FALSE),
    ('Grace Kim', 'grace@company.com', 5, 88000.00, '2020-05-20', TRUE),
    ('Henry Clark', 'henry@company.com', 5, 91000.00, '2023-08-05', TRUE),
    ('Ivy Adams', 'ivy@company.com', 1, 105000.00, '2021-02-15', TRUE),
    ('Jack White', 'jack@company.com', 3, 72000.00, '2024-01-10', TRUE);
