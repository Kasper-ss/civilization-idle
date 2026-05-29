-- Unblock Prisma Migrate when a previous deploy left advisory lock 72707369 held.
SELECT pg_advisory_unlock_all();

SELECT pg_terminate_backend(sa.pid)
FROM pg_locks pl
INNER JOIN pg_stat_activity sa ON sa.pid = pl.pid
WHERE pl.locktype = 'advisory'
  AND pl.objid = 72707369
  AND sa.pid <> pg_backend_pid();
