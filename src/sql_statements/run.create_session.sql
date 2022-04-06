INSERT INTO
    session
VALUES
    (
        $token,
        CAST($user_id AS BIGINT),
        strftime('%s', 'now') + 604800
    )