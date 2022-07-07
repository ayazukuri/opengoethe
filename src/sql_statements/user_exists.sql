SELECT
    COUNT(*) AS c
FROM
    user
WHERE
    email = $email OR
    username = $username
