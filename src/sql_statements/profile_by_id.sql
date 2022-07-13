SELECT
    CAST(id AS varchar(50)) AS id,
    username,
    permission_level,
    ((id >> 22) + 1640991600000) AS creation_time,
    summary,
    realname
FROM
    user
WHERE
    id = CAST($id AS BIGINT)