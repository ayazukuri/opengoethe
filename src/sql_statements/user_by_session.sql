SELECT
    CAST(user.id AS varchar(50)) AS id,
    user.email AS email,
    user.username AS username,
    user.permission_level AS permission_level,
    summary
FROM
    session
    INNER JOIN user ON user.id = session.`user_id`
WHERE
    session.token = $token