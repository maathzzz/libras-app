import { writeFile } from 'node:fs/promises';

import { buildSeedContent } from './content';
import { renderSeedSql, SEED_FILE } from './seedSql';

await writeFile(SEED_FILE, renderSeedSql(buildSeedContent()));
