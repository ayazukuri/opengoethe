UPDATE
    `transaction`
SET
    `status` = $status
WHERE
    id = CAST($id AS BIGINT)
