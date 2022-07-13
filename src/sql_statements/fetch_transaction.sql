SELECT
    CAST(id AS varchar(50)) AS id,
    CAST(`user_id` AS varchar(50)) AS `user_id`,
    `status`,
    `action`,
    `data`,
    friendly
FROM
    `transaction`
WHERE
    `key` = $key