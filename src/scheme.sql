CREATE TABLE IF NOT EXISTS session (
    token TINYTEXT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    expiry TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS user (
    id BIGINT PRIMARY KEY,
    email varchar(254) UNIQUE NOT NULL,
    username varchar(36) UNIQUE NOT NULL,
    password_hash CHAR(60) NOT NULL,
    permission_level TINYINT NOT NULL,
    avatar TINYTEXT,
    bio varchar(350)
);