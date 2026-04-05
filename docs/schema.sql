-- CreateTable
CREATE TABLE `notices` (
    `id` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `title` VARCHAR(191) NOT NULL,
    `body` VARCHAR(191) NOT NULL,
    `level` ENUM('info', 'warning', 'danger', 'success') NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `starts_at` DATETIME(3) NULL,
    `ends_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

