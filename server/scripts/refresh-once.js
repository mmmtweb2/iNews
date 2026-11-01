// Run one full refresh from the command line and print a report:
//   ANTHROPIC_API_KEY=... node scripts/refresh-once.js
// Useful for checking which feeds work before deploying.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createRuntime } = require('../src/bootstrap');

const runtime = createRuntime();

runtime
    .runRefresh()
    .then(run => {
        console.log(JSON.stringify({ ok: run.ok, counts: run.counts, usage: run.usage, durationMs: run.durationMs }, null, 2));
        console.log('\nSources:');
        for (const source of run.sources) {
            console.log(`  ${source.ok ? 'ok  ' : 'FAIL'} ${source.name.padEnd(28)} ${source.ok ? `${source.count} items` : source.error}`);
        }
        process.exit(run.ok ? 0 : 1);
    })
    .catch(error => {
        console.error(error.message);
        process.exit(1);
    });
