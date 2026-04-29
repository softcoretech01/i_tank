-- Migration to create screens_master and link with role_rights
-- 1. Create screens_master table
CREATE TABLE IF NOT EXISTS screens_master (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    screen_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    status TINYINT DEFAULT 1,
    UNIQUE KEY unique_screen (module_name, screen_name)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Fix collation if table already existed
ALTER TABLE screens_master CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Populate screens_master with known screens
INSERT INTO screens_master (module_name, screen_name) VALUES
('Web Application', 'Tank details'),
('Web Application', 'Inspection Report'),
('Web Application', 'Generate PPT'),
('Masters', 'Tank Code/ISO Code'),
('Masters', 'Regulations'),
('Masters', 'P&ID Drawings'),
('Masters', 'Certificates'),
('Masters', 'Tank Frame & Outer Shell')
ON DUPLICATE KEY UPDATE module_name=module_name;

-- 3. Alter role_rights to add screen_id
ALTER TABLE role_rights ADD COLUMN IF NOT EXISTS screen_id INT;

UPDATE role_rights rr
JOIN screens_master sm ON rr.screen COLLATE utf8mb4_unicode_ci = sm.screen_name COLLATE utf8mb4_unicode_ci
SET rr.screen_id = sm.id;

-- 5. Ensure EVERY role has an entry for EVERY screen in screens_master
-- This adds missing screen/role combinations with default read-only access
INSERT INTO role_rights (user_role_id, module_access, screen, screen_id, edit_only, read_only)
SELECT 
    rm.role_id, 
    sm.module_name, 
    sm.screen_name, 
    sm.id, 
    0, -- edit_only default 0
    0  -- read_only default 0 (initially hidden, admin can enable)
FROM role_master rm
CROSS JOIN screens_master sm
WHERE NOT EXISTS (
    SELECT 1 FROM role_rights rr 
    WHERE rr.user_role_id = rm.role_id AND rr.screen_id = sm.id
)
-- Also try to match by name if screen_id is null but screen name exists (fallback)
AND NOT EXISTS (
    SELECT 1 FROM role_rights rr 
    WHERE rr.user_role_id = rm.role_id 
    AND rr.screen COLLATE utf8mb4_unicode_ci = sm.screen_name COLLATE utf8mb4_unicode_ci
);

-- 6. Final cleanup: Update any rows that might have matched by name but missed screen_id
UPDATE role_rights rr
JOIN screens_master sm ON rr.screen COLLATE utf8mb4_unicode_ci = sm.screen_name COLLATE utf8mb4_unicode_ci
SET rr.screen_id = sm.id
WHERE rr.screen_id IS NULL;

-- 7. Add foreign key if not exists
-- Note: MySQL doesn't have a clean ADD CONSTRAINT IF NOT EXISTS in one line without SP or check
-- We will just try to add it. If it fails because it exists, it's fine.

-- 6. Update sp_GetUserRights to join with screens_master
DROP PROCEDURE IF EXISTS sp_GetUserRights;
DELIMITER //
CREATE PROCEDURE sp_GetUserRights(
    IN p_role_id INT
)
BEGIN
    SELECT 
        sm.screen_name AS screen, 
        rr.edit_only, 
        rr.read_only,
        sm.module_name
    FROM role_rights rr
    JOIN screens_master sm ON rr.screen_id = sm.id
    WHERE rr.user_role_id = p_role_id 
      AND (rr.edit_only = 1 OR rr.read_only = 1);
END //
DELIMITER ;
