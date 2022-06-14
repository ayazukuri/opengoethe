SELECT
    CAST(id AS varchar(50)) AS id,
    username,
    permission_level,
    avatar
FROM
    user
LIMIT $max