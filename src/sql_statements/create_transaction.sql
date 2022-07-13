INSERT INTO
    `transaction`
    (
        id,
        `user_id`,
        `key`,
        `status`,
        `action`,
        `data`,
        friendly
    )
VALUES
    (
        CAST($id AS BIGINT),
        CAST($user_id AS BIGINT),
        $key,
        0,
        $action,
        $data,
        $friendly
    )
