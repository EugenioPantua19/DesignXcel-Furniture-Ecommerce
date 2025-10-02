-- =====================================================
-- DATABASE BACKUP SCRIPT
-- =====================================================
-- This script creates a backup of the DesignXcel database
-- before removing unused tables
-- 
-- IMPORTANT: Run this script BEFORE running remove_unused_tables.sql
-- =====================================================

-- Create backup directory if it doesn't exist
-- Note: You may need to create the directory manually on your system

-- Full database backup
BACKUP DATABASE office_furniture_db 
TO DISK = 'C:\backup\office_furniture_db_backup_before_cleanup.bak'
WITH 
    FORMAT,
    INIT,
    NAME = 'office_furniture_db Full Backup Before Cleanup',
    DESCRIPTION = 'Full backup before removing unused tables',
    COMPRESSION,
    CHECKSUM;

PRINT 'Database backup completed successfully!';
PRINT 'Backup location: C:\backup\office_furniture_db_backup_before_cleanup.bak';
PRINT '';
PRINT 'You can now safely run the remove_unused_tables.sql script.';
PRINT '';

-- Verify backup was created
RESTORE VERIFYONLY 
FROM DISK = 'C:\backup\office_furniture_db_backup_before_cleanup.bak';

PRINT 'Backup verification completed successfully!';
