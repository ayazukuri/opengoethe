INSERT INTO
    session
VALUES
    (
        CAST($id AS BIGINT),
        $token,
        CAST($user_id AS BIGINT),
        strftime('%s', 'now') + 604800
    )