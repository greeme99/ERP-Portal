// 엔티티 JSON 파일 저장소 — 의존성 없이 node:fs 만 사용한다.
// 프로토타입 합성 데이터용이며 실제 개인정보·인증정보를 담지 않는다.
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

// 저장 키는 파일명이 되므로 경로 조작을 막기 위해 화이트리스트 패턴만 허용한다.
// 첫 글자에 밑줄을 허용하지 않으므로 아래 _sequence.json 과 절대 충돌하지 않는다.
const KEY_PATTERN = /^[a-z0-9][a-z0-9_.-]{0,63}$/;
const MAX_ROWS = 10_000;

// ID 순번 — 클라이언트가 구간을 예약해 가고 서버는 최고 수위만 관리한다.
const SEQUENCE_FILE = "_sequence.json";
const SEQUENCE_START = 1000;
const MAX_SEQUENCE = 999_999_999;
const MAX_RESERVE = 10_000;

// 문서번호 채번 — 문서유형·기간별로 구멍 없이 1씩 올린다.
// (전표·발주서처럼 사용자에게 보이고 감사 대상이 되는 번호)
const DOCNUM_FILE = "_docnumber.json";
const DOCTYPE_PATTERN = /^[A-Z][A-Z0-9]{0,7}$/;
const PERIOD_PATTERN = /^[0-9]{2,6}$/;
const MAX_DOC_SEQ = 999_999;

export function isValidKey(key) {
  return typeof key === "string" && KEY_PATTERN.test(key) && !key.includes("..");
}

export function validateEntities(value) {
  if (!Array.isArray(value)) return "데이터가 배열이 아닙니다.";
  if (value.length > MAX_ROWS) return `행 수가 상한 ${MAX_ROWS}을 초과합니다.`;
  const ids = new Set();
  for (const row of value) {
    if (row === null || typeof row !== "object" || Array.isArray(row)) return "행이 객체가 아닙니다.";
    const { id } = row;
    if (typeof id !== "string" || id.length === 0) return "행에 문자열 id 가 없습니다.";
    if (ids.has(id)) return `중복된 id 입니다: ${id}`;
    ids.add(id);
  }
  return null;
}

export function createStorage(dataDir) {
  const root = resolve(dataDir);
  // 키별 쓰기를 직렬화해 read-modify-write 경합으로 갱신이 유실되는 것을 막는다.
  const chains = new Map();

  const pathFor = (key) => {
    const target = resolve(join(root, `${key}.json`));
    // 패턴 검증을 통과했더라도 최종 경로가 root 밖이면 거부한다.
    if (target !== join(root, `${key}.json`) || !target.startsWith(root)) {
      throw new Error(`허용되지 않은 저장 경로: ${key}`);
    }
    return target;
  };

  const serialize = (key, task) => {
    const prev = chains.get(key) ?? Promise.resolve();
    const next = prev.then(task, task);
    // 앞 작업이 실패해도 뒤 작업이 이어지도록 거부를 삼킨 체인을 보관한다.
    chains.set(key, next.catch(() => {}));
    return next;
  };

  const readSequence = async () => {
    try {
      const raw = await readFile(join(root, SEQUENCE_FILE), "utf8");
      const parsed = JSON.parse(raw);
      const value = Number(parsed?.value);
      return Number.isSafeInteger(value) && value >= SEQUENCE_START && value <= MAX_SEQUENCE ? value : SEQUENCE_START;
    } catch {
      return SEQUENCE_START;
    }
  };

  const readDocMap = async () => {
    try {
      const raw = await readFile(join(root, DOCNUM_FILE), "utf8");
      const parsed = JSON.parse(raw);
      return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  };

  const writeDocMap = async (map) => {
    const target = join(root, DOCNUM_FILE);
    const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tmp, JSON.stringify(map), "utf8");
    await rename(tmp, target);
  };

  const writeSequence = async (value) => {
    const target = join(root, SEQUENCE_FILE);
    const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tmp, JSON.stringify({ value }), "utf8");
    await rename(tmp, target);
  };

  return {
    async init() {
      await mkdir(root, { recursive: true });
    },

    async read(key) {
      try {
        const raw = await readFile(pathFor(key), "utf8");
        const parsed = JSON.parse(raw);
        return validateEntities(parsed) === null ? parsed : null;
      } catch (error) {
        if (error?.code === "ENOENT") return null;
        console.warn(`[storage] ${key} 읽기 실패:`, error.message);
        return null;
      }
    },

    async readAll() {
      const out = {};
      let names = [];
      try {
        names = await readdir(root);
      } catch {
        return out;
      }
      for (const name of names) {
        if (!name.endsWith(".json")) continue;
        const key = name.slice(0, -5);
        if (!isValidKey(key)) continue;
        const data = await this.read(key);
        if (data) out[key] = data;
      }
      return out;
    },

    // 임시 파일에 쓴 뒤 rename 으로 교체해 중간 상태가 남지 않게 한다.
    write(key, data) {
      return serialize(key, async () => {
        const target = pathFor(key);
        const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
        await writeFile(tmp, JSON.stringify(data), "utf8");
        await rename(tmp, target);
        return data;
      });
    },

    /**
     * 겹치지 않는 ID 구간을 예약해 준다. 여러 클라이언트가 같은 서버를 쓰더라도
     * 각자 다른 구간을 받으므로 id 가 충돌하지 않는다.
     * 쓰기가 직렬화되므로 동시 예약도 안전하다.
     */
    reserveSequence(count) {
      const size = Math.min(Math.max(Math.trunc(count) || 1, 1), MAX_RESERVE);
      return serialize(SEQUENCE_FILE, async () => {
        const current = await readSequence();
        if (current >= MAX_SEQUENCE) throw Object.assign(new Error("ID 순번이 상한에 도달했습니다."), { status: 507 });
        const start = current + 1;
        const end = Math.min(current + size, MAX_SEQUENCE);
        await writeSequence(end);
        return { start, end };
      });
    },

    readSequence,

    /**
     * 저장되는 행의 id 에서 순번을 관찰해 최고 수위를 올린다.
     * seed 데이터가 먼저 들어온 뒤 예약이 시작되어도 번호가 겹치지 않게 한다.
     */
    observeIds(rows) {
      let max = 0;
      for (const row of rows) {
        const match = /-(\d+)$/.exec(String(row?.id ?? ""));
        if (!match) continue;
        const value = Number(match[1]);
        if (Number.isSafeInteger(value) && value <= MAX_SEQUENCE) max = Math.max(max, value);
      }
      if (max <= SEQUENCE_START) return Promise.resolve();
      return serialize(SEQUENCE_FILE, async () => {
        const current = await readSequence();
        if (max > current) await writeSequence(max);
      });
    },

    /**
     * 문서번호를 하나 발급한다. 문서유형·기간 조합별로 1씩 증가하며 구멍이 없다.
     * 쓰기가 직렬화되므로 동시 요청에도 같은 번호가 두 번 나가지 않는다.
     */
    nextDocNumber(docType, period) {
      if (!DOCTYPE_PATTERN.test(String(docType))) {
        throw Object.assign(new Error("허용되지 않은 문서유형입니다."), { status: 400 });
      }
      if (!PERIOD_PATTERN.test(String(period))) {
        throw Object.assign(new Error("허용되지 않은 기간입니다."), { status: 400 });
      }
      const mapKey = `${docType}:${period}`;
      return serialize(DOCNUM_FILE, async () => {
        const map = await readDocMap();
        const current = Number(map[mapKey]);
        const base = Number.isSafeInteger(current) && current >= 0 ? current : 0;
        if (base >= MAX_DOC_SEQ) throw Object.assign(new Error("문서번호가 상한에 도달했습니다."), { status: 507 });
        const seq = base + 1;
        map[mapKey] = seq;
        await writeDocMap(map);
        return { docType, period, seq, number: `${docType}-${period}${String(seq).padStart(3, "0")}` };
      });
    },

    /**
     * 저장되는 행의 code 에서 문서번호를 관찰해 수위를 올린다.
     * seed 나 다른 경로로 들어온 번호와 겹치지 않게 한다.
     */
    observeDocNumbers(rows) {
      const highest = new Map();
      for (const row of rows) {
        const m = /^([A-Z][A-Z0-9]{0,7})-([0-9]{2})([0-9]{3,6})$/.exec(String(row?.code ?? ""));
        if (!m) continue;
        const mapKey = `${m[1]}:${m[2]}`;
        const seq = Number(m[3]);
        if (!Number.isSafeInteger(seq) || seq > MAX_DOC_SEQ) continue;
        highest.set(mapKey, Math.max(highest.get(mapKey) ?? 0, seq));
      }
      if (highest.size === 0) return Promise.resolve();
      return serialize(DOCNUM_FILE, async () => {
        const map = await readDocMap();
        let changed = false;
        for (const [mapKey, seq] of highest) {
          const current = Number(map[mapKey]) || 0;
          if (seq > current) {
            map[mapKey] = seq;
            changed = true;
          }
        }
        if (changed) await writeDocMap(map);
      });
    },

    // 읽고-바꾸고-쓰기를 같은 직렬 체인 안에서 처리한다.
    mutate(key, mutator) {
      return serialize(key, async () => {
        const current = (await this.read(key)) ?? [];
        const next = mutator(current);
        const invalid = validateEntities(next);
        if (invalid) throw Object.assign(new Error(invalid), { status: 400 });
        const target = pathFor(key);
        const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
        await writeFile(tmp, JSON.stringify(next), "utf8");
        await rename(tmp, target);
        return next;
      });
    },
  };
}
