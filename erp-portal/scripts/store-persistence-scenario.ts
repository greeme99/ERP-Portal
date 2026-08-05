import { createStore, nextId } from "../src/services/store";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  failReads = false;
  failWrites = false;

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    if (this.failReads) throw new DOMException("Storage read blocked", "SecurityError");
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    if (this.failWrites) throw new DOMException("Storage quota exceeded", "QuotaExceededError");
    this.values.set(key, value);
  }
}

const PREFIX = "erp-portal:prototype:v1";
const storage = new MemoryStorage();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });

let passed = 0;
let failed = 0;
const check = (condition: boolean, message: string) => {
  console.log(`${condition ? "PASS" : "FAIL"} | ${message}`);
  condition ? passed++ : failed++;
};

const seed = [{ id: "A-1", name: "초기" }];
const first = createStore("test.primary", seed);
check(first.getAll()[0].name === "초기", "저장값이 없으면 seed를 사용한다");

first.create({ id: "A-2", name: "생성" });
first.update("A-1", { id: "변경금지", name: "수정" });
first.remove(["A-2"]);
const restored = createStore("test.primary", seed);
check(restored.getAll().length === 1 && restored.getAll()[0].name === "수정", "CRUD 결과를 같은 key에서 복원한다");
check(restored.getAll()[0].id === "A-1", "update로 id를 변경할 수 없다");

const isolated = createStore("test.isolated", [{ id: "B-1", name: "격리" }]);
check(isolated.getAll()[0].id === "B-1", "store key 사이의 데이터가 격리된다");

const legacyKey = `${PREFIX}:entity:test.legacy`;
storage.setItem(legacyKey, JSON.stringify([{ id: "L-1", name: "legacy" }]));
const legacy = createStore("test.legacy", seed);
legacy.update("L-1", { name: "migrated" });
check(JSON.parse(storage.getItem(legacyKey)!).version === 1, "raw 배열을 v1 envelope로 이행한다");

const corruptKey = `${PREFIX}:entity:test.corrupt`;
storage.setItem(corruptKey, "{broken");
const corrupt = createStore("test.corrupt", seed);
corrupt.update("A-1", { name: "메모리수정" });
check(corrupt.getAll()[0].name === "메모리수정", "손상 JSON에서도 메모리 CRUD가 동작한다");
check(storage.getItem(corruptKey) === "{broken", "손상된 원본을 자동 덮어쓰지 않는다");

const futureKey = `${PREFIX}:entity:test.future`;
const futureRaw = JSON.stringify({ version: 2, data: [{ id: "F-1" }] });
storage.setItem(futureKey, futureRaw);
const future = createStore("test.future", seed);
future.remove(["A-1"]);
check(future.getAll().length === 0 && storage.getItem(futureKey) === futureRaw, "미지원 버전은 seed fallback 후 원본을 보존한다");

storage.failWrites = true;
let notifications = 0;
const quota = createStore("test.quota", seed);
quota.subscribe(() => notifications++);
quota.create({ id: "Q-1", name: "메모리" });
check(quota.getAll()[0].id === "Q-1" && notifications === 1, "저장 실패에도 CRUD와 구독이 동작한다");
storage.failWrites = false;
quota.update("Q-1", { name: "복구저장" });
const quotaRecovered = createStore("test.quota", seed);
check(quotaRecovered.getAll()[0].name === "복구저장", "일시적 저장 실패 후 다음 변경에서 영속성이 복구된다");

storage.failReads = true;
const blocked = createStore("test.blocked", seed);
blocked.update("A-1", { name: "세션" });
check(blocked.getAll()[0].name === "세션", "저장소 접근 거부 시 메모리 모드로 동작한다");
storage.failReads = false;

storage.setItem(`${PREFIX}:sequence`, "2500");
check(nextId("ROW") === "ROW-2501", "저장된 전역 ID 순번을 이어서 발급한다");

const fullSeed = Array.from({ length: 10_000 }, (_, index) => ({ id: `LIMIT-${index}` }));
const limited = createStore("test.limit", fullSeed);
let limitRejected = false;
try {
  limited.create({ id: "LIMIT-overflow" });
} catch {
  limitRejected = true;
}
check(limitRejected && limited.getAll().length === 10_000, "복원 한도보다 큰 payload를 스스로 저장하지 않는다");

const oversizedKey = `${PREFIX}:entity:test.oversized`;
const oversized = createStore("test.oversized", [...fullSeed, { id: "LIMIT-overflow" }]);
oversized.update("LIMIT-0", { value: "memory-only" });
check(storage.getItem(oversizedKey) === null, "한도 초과 seed는 복원 불가능한 payload를 저장하지 않는다");

createStore([{ id: "EDGE-999999999" }]);
const fallbackId1 = nextId("EDGE");
const fallbackId2 = nextId("EDGE");
check(fallbackId1 !== fallbackId2 && !fallbackId1.endsWith("-1000000000"), "순번 상한에서는 고유한 대체 ID를 발급한다");

delete (globalThis as { localStorage?: Storage }).localStorage;
const nodeStore = createStore("test.node", fullSeed);
nodeStore.create({ id: "N-10001", name: "memory" });
check(nodeStore.getAll().length === 10_001, "localStorage가 없는 Node keyed store에는 영속 행 제한을 적용하지 않는다");

console.log(`\nRESULT | PASS ${passed} / FAIL ${failed}`);
if (failed > 0) process.exitCode = 1;
