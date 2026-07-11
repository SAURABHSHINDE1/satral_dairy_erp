-- Create the test database if it doesn't exist
CREATE DATABASE IF NOT EXISTS `satral_dairy_test` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create a dedicated development user and grant privileges
CREATE USER IF NOT EXISTS 'satral'@'localhost' IDENTIFIED BY 'SatralDevPass2026!';
GRANT ALL PRIVILEGES ON `satral_dairy_test`.* TO 'satral'@'localhost';
FLUSH PRIVILEGES;

-- Note: run this as an administrative user (e.g., root) to create the user and DB
