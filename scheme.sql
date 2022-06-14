CREATE TABLE IF NOT EXISTS session (
    id BIGINT PRIMARY KEY,
    token TINYTEXT UNIQUE NOT NULL,
    user_id BIGINT,
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

CREATE TABLE IF NOT EXISTS page (
    id BIGINT PRIMARY KEY,
    author_id BIGINT NOT NULL,
    content TEXT,
    name varchar(36) UNIQUE NOT NULL,
    title varchar(36) NOT NULL,
    img TINYTEXT,
    description varchar(100) NOT NULL
);