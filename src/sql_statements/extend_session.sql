UPDATE
    session
SET
    expiry = (strftime('%s', 'now') + 604800)
WHERE
    token = $token