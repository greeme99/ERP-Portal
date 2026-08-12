// 엔티티 JSON 파일 저장소 — 의존성 없이 node:fs 만 사용한다.
// 프로토타입 합성 데이터용이며 실제 개인정보·인증정보를 담지 않는다.
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

// 저장 키는 파일명이 되므로 경로 조작을 막기 위해 화이트리스트 패턴만 허용한다.
const KEY_PATTERN = /^[a-z0-9][a-z0-9_.-]{0,63}$/;
const MAX_ROWS = 10_000;

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
