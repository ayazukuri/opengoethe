SELECT
    CAST(id AS varchar(50)) AS id,
    password_hash
FROM
    user
WHERE
    email = $email