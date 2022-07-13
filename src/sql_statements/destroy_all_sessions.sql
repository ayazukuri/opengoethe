DELETE FROM
    session
WHERE
    `user_id` = CAST($user_id AS BIGINT)