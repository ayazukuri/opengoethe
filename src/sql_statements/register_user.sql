INSERT INTO
    user
    (
        id,
        email,
        username,
        password_hash,
        permission_level
    )
VALUES
    (
        CAST($id AS BIGINT),
        $email,
        $username,
        $passwordHash,
        0
    );
