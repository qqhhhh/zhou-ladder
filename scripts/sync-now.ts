import { syncOpenDota } from "../src/lib/sync/opendotaSync";
import { syncStratz } from "../src/lib/sync/stratzSync";
import { getTurso } from "../src/lib/turso";

async function main() {
  const db = getTurso();
  const before = await db.execute(
    "SELECT COUNT(*) AS n, MAX(match_id) AS max_id, MAX(start_time) AS max_st FROM ranked_matches",
  );
  console.log("before", before.rows[0]);
  try {
    console.log("opendota", JSON.stringify(await syncOpenDota({ full: false })));
  } catch (e) {
    console.log("opendota_err", e instanceof Error ? e.message : e);
  }
  try {
    console.log("stratz", JSON.stringify(await syncStratz({ full: false })));
  } catch (e) {
    console.log("stratz_err", e instanceof Error ? e.message : e);
  }
  const after = await db.execute(
    "SELECT COUNT(*) AS n, MAX(match_id) AS max_id, MAX(start_time) AS max_st FROM ranked_matches",
  );
  console.log("after", after.rows[0]);
  const recent = await db.execute(
    "SELECT match_id, start_time, hero_id, win, source FROM ranked_matches ORDER BY start_time DESC LIMIT 6",
  );
  console.log("recent", recent.rows);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
