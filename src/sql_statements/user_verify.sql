UPDATE
    user
SET
    permission_level = 1
WHERE
    id = CAST($id AS BIGINT) AND
    permission_level  = 0
