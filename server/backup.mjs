import {chmod, link, mkdtemp, rm} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {backup, DatabaseSync} from 'node:sqlite';
import {communityDatabasePath} from './community.mjs';

async function backUpDatabase(destination) {
  // Publish the finished snapshot atomically, without replacing an existing file.
  const staging = await mkdtemp(join(dirname(destination), '.mpdb-backup-'));
  const snapshot = join(staging, 'atlas.sqlite');
  try {
    const source = new DatabaseSync(communityDatabasePath(), {readOnly:true,timeout:5000});
    try {
      await backup(source,snapshot);
    } finally {
      source.close();
    }
    await chmod(snapshot,0o600);
    const check = new DatabaseSync(snapshot,{readOnly:true});
    try {
      if (check.prepare('PRAGMA quick_check').get().quick_check !== 'ok') {
        throw new Error('The SQLite snapshot did not pass its integrity check.');
      }
    } finally {
      check.close();
    }
    await link(snapshot,destination);
  } finally {
    await rm(staging,{recursive:true,force:true});
  }
}

const [output,...extra] = process.argv.slice(2);
if (!output || extra.length) {
  console.error('Usage: npm run community:backup -- PATH_TO_NEW_BACKUP');
  process.exitCode = 1;
} else {
  try {
    const destination = resolve(output);
    await backUpDatabase(destination);
    console.log('Community backup saved to ' + destination);
  } catch (error) {
    console.error(error.code === 'EEXIST' ? 'Choose a new backup path. That file already exists.' : error.message);
    process.exitCode = 1;
  }
}
