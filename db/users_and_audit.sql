CREATE TABLE `users` (
  `id`                    CHAR(36)      NOT NULL,
  `created_at`            DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`            DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `version`               INT           NOT NULL DEFAULT 1,

  -- Identidad
  `email`                 VARCHAR(255)  NOT NULL,
  `username`              VARCHAR(100)      NULL,
  `password_hash`         VARCHAR(255)  NOT NULL,

  -- Perfil
  `first_name`            VARCHAR(100)      NULL,
  `last_name`             VARCHAR(100)      NULL,
  `avatar_url`            VARCHAR(500)      NULL,
  `locale`                VARCHAR(10)       NULL DEFAULT 'es',

  -- Estado
  `is_active`             TINYINT(1)    NOT NULL DEFAULT 1,
  `is_email_verified`     TINYINT(1)    NOT NULL DEFAULT 0,
  `email_verified_at`     DATETIME(3)       NULL,

  -- Seguridad
  `failed_login_attempts` INT           NOT NULL DEFAULT 0,
  `locked_until`          DATETIME(3)       NULL,
  `password_changed_at`   DATETIME(3)       NULL,
  `last_login_at`         DATETIME(3)       NULL,

  -- Auditoría de actor
  `created_by`            CHAR(36)          NULL,
  `updated_by`            CHAR(36)          NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `users_email_idx` (`email`),
  UNIQUE INDEX `users_username_idx` (`username`),
  INDEX `users_is_active_idx` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Añadir a la tabla users
ALTER TABLE `users`
  ADD COLUMN `role` VARCHAR(50) NOT NULL DEFAULT 'user' AFTER `is_active`;

-- Índice opcional, útil si filtras usuarios por rol
ALTER TABLE `users`
  ADD INDEX `users_role_idx` (`role`);

CREATE TABLE `user_login_audit` (
  `id`             CHAR(36)      NOT NULL,
  `created_at`     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  -- Quién
  `user_id`        CHAR(36)          NULL,  -- NULL si el usuario no existe
  `email`          VARCHAR(255)  NOT NULL,  -- email intentado aunque no exista

  -- Resultado
  `action`         VARCHAR(50)   NOT NULL,  -- LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT,
                                            -- PASSWORD_RESET_REQUESTED, ACCOUNT_LOCKED
  `success`        TINYINT(1)    NOT NULL DEFAULT 0,
  `failure_reason` VARCHAR(100)      NULL,  -- INVALID_PASSWORD, USER_NOT_FOUND,
                                            -- ACCOUNT_LOCKED, EMAIL_NOT_VERIFIED

  -- Contexto técnico
  `ip_address`     VARCHAR(45)       NULL,  -- VARCHAR(45) soporta IPv6
  `user_agent`     VARCHAR(500)      NULL,
  `device_type`    VARCHAR(50)       NULL,  -- desktop, mobile, tablet
  `location`       VARCHAR(255)      NULL,  -- país/ciudad si usas geolocalización

  -- Sesión
  `session_id`     VARCHAR(255)      NULL,
  `token_jti`      VARCHAR(255)      NULL,  -- JWT ID para blacklisting

  PRIMARY KEY (`id`),
  INDEX `user_login_audit_user_id_idx`   (`user_id`),
  INDEX `user_login_audit_email_idx`     (`email`),
  INDEX `user_login_audit_created_at_idx` (`created_at`),
  INDEX `user_login_audit_action_idx`    (`action`),

  CONSTRAINT `fk_user_login_audit_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `refresh_tokens` (
  `id`         CHAR(36)     NOT NULL,
  `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expires_at` DATETIME(3)  NOT NULL,
  `user_id`    CHAR(36)     NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `is_revoked` TINYINT(1)   NOT NULL DEFAULT 0,
  `ip_address` VARCHAR(45)      NULL,
  `user_agent` VARCHAR(500)     NULL,

  PRIMARY KEY (`id`),
  INDEX `refresh_tokens_user_id_idx` (`user_id`),
  INDEX `refresh_tokens_token_hash_idx` (`token_hash`),

  CONSTRAINT `fk_refresh_tokens_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_c