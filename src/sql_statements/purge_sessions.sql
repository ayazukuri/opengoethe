DELETE FROM
    session
WHERE
    expiry < strftime('%s', 'now')