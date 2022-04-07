SELECT
    CAST(page.id AS varchar(50)) AS id,
    ((page.id >> 22) + 1640991600000) AS creation_time,
    page.name AS name,
    page.title AS title,
    page.img AS img,
    page.description AS description,
    CAST(user.id AS varchar(50)) AS author_id,
    user.username AS author_username,
    user.permission_level AS author_permission_level,
    user.avatar AS author_avatar
FROM
    page
    INNER JOIN user ON page.author_id = user.id
LIMIT $max