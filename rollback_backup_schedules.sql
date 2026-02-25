-- Rollback script: Drop backup_schedules table
-- Run this SQL script if the migration has already been executed

-- For MySQL/MariaDB:
DROP TABLE IF EXISTS `backup_schedules`;

-- For PostgreSQL:
-- DROP TABLE IF EXISTS backup_schedules CASCADE;

-- Also remove from migrations table if needed (optional)
-- DELETE FROM migrations WHERE migration = '2026_02_02_155701_create_backup_schedules_table';

