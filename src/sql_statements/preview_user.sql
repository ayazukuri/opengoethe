SELECT
    CAST(id AS varchar(50)) AS id,
    username,
    permission_level
FROM
    user
LIMIT $max