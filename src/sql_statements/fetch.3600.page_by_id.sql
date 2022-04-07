SELECT
    CAST(page.id AS varchar(50)) AS id,
    ((page.id >> 22) + 1640991600000) AS creation_time,
    page.content AS content,
    page.name AS name,
    page.title AS title,
    CAST(user.id AS varchar(50)) AS author_id,
    user.username AS author_username,
    user.permission_level AS author_permission_level,
    user.avatar AS author_avatar
FROM
    page
    INNER JOIN user ON user.id = page.author_id
WHERE
    page.id = CAST($id AS BIGINT)