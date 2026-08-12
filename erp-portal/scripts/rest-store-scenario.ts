// REST 모드 store 왕복 검증 — 실제 서버를 띄우고 store.ts 의 낙관적 쓰기·롤백·
// 스냅샷 부트스트랩이 계약을 지키는지 확인한다.
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

let pass = 0;
let fail = 0;
const check = (ok: boolean, label: string, detail = "") => {
  if (ok) { pass++; console.log(`PASS | ${label}`); }
  else { fail++; console.log(`FAIL | ${label}${detail ? ` — ${detail}` : ""}`); }
};

const dataDir = await mkdtemp(join(tmpdir(), "erp-reststore-"));
process.env.DATA_DIR = dataDir;

const { start, server } = await import("../server/index.mjs");
await start(0, "127.0.0.1");
const addr = server.address();
const base = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}`;

// restBackend 는 Node 에서 ERP_API_URL 을 읽는다. 모듈 로드 전에 설정해야 한다.
process.env.ERP_API_URL = base;

const backend = await import("../src/services/restBackend");
const storeMod = await import("../src/services/store");

console.log("\n[1] 설정 감지와 부트스트랩");
{
  check(backend.isRestConfigured() === true, "VITE_API_URL 이 있으면 REST 설정으로 인식한다");
  // 서버에 미리 데이터를 넣어 두고 스냅샷이 seed 를 덮어쓰는지 본다
  await fetch(`${base}/api/entities/test.master`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [{ id: "S-1", name: "서버에서 온 행" }] }),
  });

  const store = storeMod.createStore("test.master", [
    { id: "L-1", name: "seed 행 1" },
    { id: "L-2", name: "seed 행 2" },
  ]);
  check(store.getAll().length === 2 && store.getAll()[0].id === "L-1", "부트스트랩 전에는 seed 로 동작한다");

  const status = await backend.bootstrapBackend();
  check(status === "rest", `서버에 연결되면 상태가 rest 다 (실제: ${status})`);

  const adopted = storeMod.hydrateFromBackend();
  check(adopted >= 1, "스냅샷이 있는 키를 주입한다");
  check(
    store.getAll().length === 1 && store.getAll()[0].id === "S-1",
    "서버 데이터가 seed 를 대체한다",
    JSON.stringify(store.getAll())
  );
}

console.log("\n[2] 낙관적 쓰기 — 캐시 즉시 반영 후 서버 반영");
{
  const store = storeMod.createStore("test.write", [{ id: "W-1", n: 1 }]);
  await backend.bootstrapBackend();
  storeMod.hydrateFromBackend();

  const created = store.create({ id: "W-2", n: 2 });
  check(created.id === "W-2", "create() 는 Entity 를 동기 반환한다 (계약 유지)");
  check(store.getAll().some((r) => r.id === "W-2"), "캐시에 즉시 반영된다");

  await backend.remote.drain();
  const afterCreate = await (await fetch(`${base}/api/entities/test.write`)).json();
  check(afterCreate.data.some((r: any) => r.id === "W-2"), "서버에도 반영된다", JSON.stringify(afterCreate.data));

  store.update("W-2", { n: 99 });
  await backend.remote.drain();
  const afterUpdate = await (await fetch(`${base}/api/entities/test.write`)).json();
  check(afterUpdate.data.find((r: any) => r.id === "W-2")?.n === 99, "update 가 서버에 반영된다");

  store.remove(["W-2"]);
  await backend.remote.drain();
  const afterRemove = await (await fetch(`${base}/api/entities/test.write`)).json();
  check(!afterRemove.data.some((r: any) => r.id === "W-2"), "remove 가 서버에 반영된다");
}

console.log("\n[3] replaceAll — 일괄 반영은 PUT 한 번으로 원자적");
{
  const store = storeMod.createStore("test.bulk", []);
  await backend.bootstrapBackend();
  storeMod.hydrateFromBackend();

  const rows = Array.from({ length: 50 }, (_, i) => ({ id: `B-${i}`, n: i }));
  store.replaceAll(rows);
  check(store.getAll().length === 50, "캐시가 즉시 교체된다");

  await backend.remote.drain();
  const saved = await (await fetch(`${base}/api/entities/test.bulk`)).json();
  check(saved.data.length === 50, "서버에 50건이 한 번에 반영된다", `count=${saved.data.length}`);
}

console.log("\n[4] 쓰기 실패 시 서버 상태로 롤백하고 통지한다");
{
  await fetch(`${base}/api/entities/test.rollback`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [{ id: "R-1", n: 1 }] }),
  });
  const store = storeMod.createStore("test.rollback", []);
  await backend.bootstrapBackend();
  storeMod.hydrateFromBackend();
  check(store.getAll().length === 1, "서버 데이터로 시작한다");

  const messages: string[] = [];
  storeMod.setWriteFailureHandler((m) => messages.push(m));

  // 다른 사용자가 지운 행을 수정하는 상황을 만든다.
  // 서버에서만 삭제하므로 클라이언트 캐시는 아직 해당 행을 갖고 있다.
  await fetch(`${base}/api/entities/test.rollback`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: ["R-1"] }),
  });

  store.update("R-1", { n: 999 });
  check(store.getAll()[0]?.n === 999, "캐시에는 낙관적으로 먼저 반영된다");

  await backend.remote.drain();
  await new Promise((r) => setTimeout(r, 200)); // refetch 완료 대기

  check(messages.length === 1, "실패가 1건 통지된다", JSON.stringify(messages));
  check(/수정/.test(messages[0] ?? ""), "통지 메시지에 동작 이름이 담긴다", messages[0]);
  check(store.getAll().length === 0, "캐시가 서버 상태(삭제됨)로 롤백된다", JSON.stringify(store.getAll()));

  storeMod.setWriteFailureHandler((m) => console.error(`[ERP store] ${m}`));
}

console.log("\n[5] 서버 발급 ID — 클라이언트 간 충돌 방지");
{
  await backend.bootstrapBackend();
  const primed = await storeMod.primeIdBlock();
  check(primed === true, "부트스트랩에서 ID 구간을 확보한다");

  const first = storeMod.nextId("MAT");
  check(/^MAT-\d+$/.test(first), `사람이 읽는 코드 형식을 유지한다 (${first})`);

  const mine = new Set<string>();
  for (let i = 0; i < 120; i++) mine.add(storeMod.nextId("MAT"));
  check(mine.size === 120, "같은 클라이언트 안에서 120건이 모두 고유하다", `unique=${mine.size}`);

  // 두 번째 "클라이언트"를 별도 모듈 인스턴스로 띄워 구간이 겹치지 않는지 본다
  const stamp = Date.now();
  const backend2 = await import(`../src/services/restBackend?c2=${stamp}`);
  const store2 = await import(`../src/services/store?c2=${stamp}`);
  await backend2.bootstrapBackend();
  await store2.primeIdBlock();

  const theirs = new Set<string>();
  for (let i = 0; i < 120; i++) theirs.add(store2.nextId("MAT"));
  check(theirs.size === 120, "두 번째 클라이언트도 120건 고유");

  const collisions = [...mine].filter((id) => theirs.has(id));
  check(collisions.length === 0, "두 클라이언트의 id 가 전혀 겹치지 않는다", `충돌 ${collisions.length}건: ${collisions.slice(0, 3)}`);
}

console.log("\n[6] 서버가 없으면 localStorage/메모리 모드로 폴백한다");
{
  server.close();
  await new Promise((r) => setTimeout(r, 100));

  const status = await backend.bootstrapBackend();
  check(status === "localStorage", `연결 실패 시 상태가 localStorage 다 (실제: ${status})`);

  const store = storeMod.createStore("test.offline", [{ id: "O-1", n: 1 }]);
  const created = store.create({ id: "O-2", n: 2 });
  check(created.id === "O-2" && store.getAll().length === 2, "폴백 모드에서도 쓰기가 동작한다");
  check(storeMod.hydrateFromBackend() === 0, "폴백 모드에서는 주입하지 않는다");
}

await rm(dataDir, { recursive: true, force: true });

console.log(`\n═══ 결과: PASS ${pass} / FAIL ${fail} — ${fail === 0 ? "✅ REST store 검증 성공" : "❌ 실패 있음"} ═══`);
process.exit(fail === 0 ? 0 : 1);
