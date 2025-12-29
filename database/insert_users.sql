-- ===================================
-- CREAR USUARIOS CON CONTRASEÑAS
-- ===================================
-- Este script crea los usuarios del sistema con contraseñas hasheadas
-- 
-- CREDENCIALES:
-- Admin: admin@zonochat.com / admin123
-- Supervisor: supervisor@zonochat.com / supervisor123
-- Agente1: agente1@zonochat.com / agente123
-- ===================================

USE zonochat;

-- Eliminar usuarios existentes si existen
DELETE FROM users WHERE email IN (
    'admin@zonochat.com',
    'supervisor@zonochat.com',
    'agente1@zonochat.com'
);

-- Insertar usuarios con contraseñas hasheadas (bcrypt, 10 rounds)
-- Password: admin123
INSERT INTO users (email, password, first_name, last_name, role) VALUES
('admin@zonochat.com', '$2a$10$8K1p/a0dL3.I9/YS4sSSzOPhGWRAyqPhq6fBKKE6xjMqXjWZQBn/i', 'Admin', 'ZonoChat', 'admin');

-- Password: supervisor123
INSERT INTO users (email, password, first_name, last_name, role) VALUES
('supervisor@zonochat.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGQIMHdzHv6/SNVWLGeqh4e', 'Supervisor', 'Demo', 'supervisor');

-- Password: agente123
INSERT INTO users (email, password, first_name, last_name, role) VALUES
('agente1@zonochat.com', '$2a$10$N9qo8uLOickgc2ZaVOhOyuCDkIjj2rVAsbr6Fwmq6YPbZxLDdP7FG', 'Agente', 'Uno', 'agent');

-- Verificar usuarios creados
SELECT id, email, first_name, last_name, role, created_at FROM users;

-- ===================================
-- RESUMEN DE CREDENCIALES
-- ===================================
-- 
-- ┌─────────────────────────────────────────────┐
-- │ ADMINISTRADOR                               │
-- │ Email: admin@zonochat.com                   │
-- │ Password: admin123                          │
-- ├─────────────────────────────────────────────┤
-- │ SUPERVISOR                                  │
-- │ Email: supervisor@zonochat.com              │
-- │ Password: supervisor123                     │
-- ├─────────────────────────────────────────────┤
-- │ AGENTE 1                                    │
-- │ Email: agente1@zonochat.com                 │
-- │ Password: agente123                         │
-- └─────────────────────────────────────────────┘
