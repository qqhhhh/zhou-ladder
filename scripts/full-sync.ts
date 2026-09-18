import { syncOpenDota } from "../src/lib/sync/opendotaSync";
import { syncStratz } from "../src/lib/sync/stratzSync";
import { countMatches, getMaxMatchId } from "../src/lib/db/matches";

async function main() {
  const before = { count: await countMatches(), max: await getMaxMatchId() };
  console.log("before", JSON.stringify(before));
  try {
    const od = await syncOpenDota({ full: true });
    console.log("opendota", JSON.stringify(od));
  } catch (e) {
    console.log("opendota_error", e instanceof Error ? e.message : e);
  }
  try {
    const st = await syncStratz({ full: true });
    console.log("stratz", JSON.stringify(st));
  } catch (e) {
    console.log("stratz_error", e instanceof Error ? e.message : e);
  }
  console.log(
    "after",
    JSON.stringify({ count: await countMatches(), max: await getMaxMatchId() }),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
