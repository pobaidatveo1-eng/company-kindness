-- 1. Update app_role enum to add new roles (separate migration for enum)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'department_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sales_staff';