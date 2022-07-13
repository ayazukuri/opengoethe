CREATE TABLE IF NOT EXISTS `session` (
    id BIGINT PRIMARY KEY,
    token TINYTEXT UNIQUE NOT NULL,
    `user_id` BIGINT,
    expiry TIMESTAMP NOT NULL
);

$$;

CREATE TABLE IF NOT EXISTS user (
    id BIGINT PRIMARY KEY,
    email varchar(254) UNIQUE NOT NULL,
    username varchar(36) UNIQUE NOT NULL,
    password_hash CHAR(60) NOT NULL,
    permission_level TINYINT NOT NULL,
    summary TEXT
);

$$;

CREATE TABLE IF NOT EXISTS `transaction` (
    id BIGINT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `key` TEXT UNIQUE NOT NULL,
    `status` INT NOT NULL,
    `action` INT NOT NULL,
    `data` TEXT,
    friendly TEXT
);

$$;

CREATE TABLE IF NOT EXISTS wire (
    id BIGINT PRIMARY KEY,
    author BIGINT NOT NULL,
    recipients varchar(100),
    subj varchar(100),
    content TEXT
);

$$;

CREATE TABLE IF NOT EXISTS wire_inbox (
    `user_id` BIGINT NOT NULL,
    wire_id BIGINT NOT NULL
);

$$;

CREATE TABLE IF NOT EXISTS wire_attach (
    id BIGINT PRIMARY KEY,
    wire_id BIGINT NOT NULL,
    `filename` varchar(255) NOT NULL,
    size INT NOT NULL
);
