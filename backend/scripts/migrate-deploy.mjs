/**
 * Production migrations for Neon/Render:
 * 1) Clear stuck Prisma advisory locks from failed deploys
 * 2) Run migrate deploy (single build lane; advisory lock disabled to avoid P1002 flakes)
 */
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!directUrl) {
  console.error('migrate-deploy: set DIRECT_URL (Neon direct, no -pooler) or DATABASE_URL');
  process.exit(1);
}

if (directUrl.includes('-pooler')) {
  console.warn(
    'migrate-deploy: DIRECT_URL looks like a pooler URL. Use Neon *direct* connection for migrations.'
  );
}

const sqlFile = join(dirname(fileURLToPath(import.meta.url)), 'release-prisma-migration-lock.sql');

function run(cmd, extraEnv = {}) {
  execSync(cmd, {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...extraEnv,
      // prisma db execute uses datasource url from schema
      DATABASE_URL: directUrl,
    },
  });
}

function releaseLocks() {
  try {
    run(`npx prisma db execute --file "${sqlFile}"`);
    console.log('migrate-deploy: released stale advisory locks');
  } catch {
    console.warn('migrate-deploy: lock release skipped (non-fatal)');
  }
}

const attempts = 3;

for (let i = 1; i <= attempts; i++) {
  console.log(`migrate-deploy: attempt ${i}/${attempts}`);
  releaseLocks();

  try {
    run('npx prisma migrate deploy', {
      PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: 'true',
    });
    console.log('migrate-deploy: success');
    process.exit(0);
  } catch {
    if (i === attempts) {
      console.error('migrate-deploy: failed after all attempts');
      process.exit(1);
    }
    console.warn('migrate-deploy: retrying in 8s...');
    execSync('sleep 8');
  }
}
