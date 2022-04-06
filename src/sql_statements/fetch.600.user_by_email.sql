SELECT
    CAST(user.id AS varchar(50)) AS id,
    email,
    username,
    permission_level,
    avatar
FROM
    user
WHERE
    email = $email