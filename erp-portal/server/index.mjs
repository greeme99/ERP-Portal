// 표준 ERP 포탈 프로토타입 백엔드 — node:http 만 사용하는 무의존성 REST 서버.
//
// 신뢰 경계: 브라우저에서 오는 모든 입력(경로 키, 본문)을 여기서 검증한다.
// 이 서버는 합성 프로토타입 데이터를 다루며 인증·인가를 구현하지 않는다.
// 운영 전환 시 서버측 인증/인가와 트랜잭션 저장소로 교체해야 한다.
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createStorage, isValidKey, validateEntities } from "./storage.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 5177);
const HOST = process.env.HOST ?? "127.0.0.1";
const DATA_DIR = process.env.DATA_DIR ?? join(HERE, "..", "data");
// 개발용 Vite 오리진만 허용한다. 목록에 없는 오리진에는 CORS 헤더를 주지 않는다.
// Vite 는 지정 포트가 사용 중이면 다음 포트로 올라가므로 폴백 구간까지 함께 허용한다.
// (허용하지 않으면 CORS 가 조용히 막혀 localStorage 모드로 떨어져 원인을 찾기 어렵다)
const DEV_PORTS = [5180, 5181, 5182, 5183];
const DEFAULT_ORIGINS = DEV_PORTS.flatMap((p) => [`http://localhost:${p}`, `http://127.0.0.1:${p}`]).join(",");
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? DEFAULT_ORIGINS)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const MAX_BODY_BYTES = 8 * 1024 * 1024;

const storage = createStorage(DATA_DIR);

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "600");
  }
}

function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(body);
}

function fail(res, status, message) {
  send(res, status, { ok: false, error: message });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error("본문이 허용 크기를 초과했습니다."), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (chunks.length === 0) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(Object.assign(new Error("본문이 올바른 JSON 이 아닙니다."), { status: 400 }));
      }
    });
    req.on("error", reject);
  });
}

// id 는 경로/본문 어디서 와도 서버가 신뢰하지 않고 문자열 여부만 확인한다.
const asId = (value) => (typeof value === "string" && value.length > 0 && value.length <= 128 ? value : null);

async function route(req, res, url) {
  const segments = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
  // /api/...
  if (segments[0] !== "api") return fail(res, 404, "알 수 없는 경로입니다.");

  if (segments[1] === "health" && req.method === "GET") {
    const all = await storage.readAll();
    return send(res, 200, { ok: true, keys: Object.keys(all).length });
  }

  if (segments[1] === "snapshot" && req.method === "GET") {
    return send(res, 200, { ok: true, data: await storage.readAll() });
  }

  // ID 순번 구간 예약 — 클라이언트가 동기로 id 를 발급하면서도 서로 겹치지 않게 한다.
  if (segments[1] === "sequence" && segments[2] === "reserve" && req.method === "POST") {
    const body = await readBody(req);
    const count = Number(body?.count ?? 1);
    if (!Number.isFinite(count) || count < 1) return fail(res, 400, "count 는 1 이상의 수여야 합니다.");
    try {
      const { start, end } = await storage.reserveSequence(count);
      return send(res, 200, { ok: true, start, end });
    } catch (error) {
      return fail(res, error.status ?? 500, error.message);
    }
  }

  // 문서번호 채번 — 문서유형·기간별 무결번. 전표·발주서 등 감사 대상 번호에 쓴다.
  if (segments[1] === "docnumber" && segments[2] === "next" && req.method === "POST") {
    const body = await readBody(req);
    try {
      const issued = await storage.nextDocNumber(String(body?.docType ?? ""), String(body?.period ?? ""));
      return send(res, 200, { ok: true, ...issued });
    } catch (error) {
      return fail(res, error.status ?? 500, error.message);
    }
  }

  if (segments[1] !== "entities") return fail(res, 404, "알 수 없는 경로입니다.");

  const key = segments[2];
  if (!isValidKey(key)) return fail(res, 400, "허용되지 않은 저장 키입니다.");
  const rowId = segments[3] ? asId(decodeURIComponent(segments[3])) : null;
  if (segments[3] && !rowId) return fail(res, 400, "허용되지 않은 id 입니다.");

  if (req.method === "GET" && !rowId) {
    return send(res, 200, { ok: true, data: (await storage.read(key)) ?? [] });
  }

  // 일괄 업로드 등 N건을 원자적으로 반영해야 하는 경로.
  if (req.method === "PUT" && !rowId) {
    const body = await readBody(req);
    const invalid = validateEntities(body?.data);
    if (invalid) return fail(res, 400, invalid);
    const saved = await storage.write(key, body.data);
    await storage.observeIds(saved);
    await storage.observeDocNumbers(saved);
    return send(res, 200, { ok: true, data: saved });
  }

  if (req.method === "POST" && !rowId) {
    const body = await readBody(req);
    const row = body?.row;
    if (row === null || typeof row !== "object" || Array.isArray(row)) return fail(res, 400, "row 객체가 필요합니다.");
    if (!asId(row.id)) return fail(res, 400, "row.id 가 필요합니다.");
    try {
      const next = await storage.mutate(key, (current) => {
        if (current.some((r) => r.id === row.id)) {
          throw Object.assign(new Error(`이미 존재하는 id 입니다: ${row.id}`), { status: 409 });
        }
        return [row, ...current];
      });
      await storage.observeIds([row]);
      await storage.observeDocNumbers([row]);
      return send(res, 201, { ok: true, data: next });
    } catch (error) {
      return fail(res, error.status ?? 500, error.message);
    }
  }

  if (req.method === "PATCH" && rowId) {
    const body = await readBody(req);
    const patch = body?.patch;
    if (patch === null || typeof patch !== "object" || Array.isArray(patch)) return fail(res, 400, "patch 객체가 필요합니다.");
    const { id: _ignored, ...safePatch } = patch; // id 는 변경 대상이 아니다
    try {
      let found = false;
      const next = await storage.mutate(key, (current) =>
        current.map((r) => {
          if (r.id !== rowId) return r;
          found = true;
          return { ...r, ...safePatch, id: rowId };
        })
      );
      if (!found) return fail(res, 404, `대상을 찾지 못했습니다: ${rowId}`);
      return send(res, 200, { ok: true, data: next });
    } catch (error) {
      return fail(res, error.status ?? 500, error.message);
    }
  }

  if (req.method === "DELETE") {
    const ids = rowId ? [rowId] : (await readBody(req))?.ids;
    if (!Array.isArray(ids) || ids.length === 0 || !ids.every(asId)) return fail(res, 400, "ids 배열이 필요합니다.");
    const targets = new Set(ids);
    const next = await storage.mutate(key, (current) => current.filter((r) => !targets.has(r.id)));
    return send(res, 200, { ok: true, data: next });
  }

  return fail(res, 405, `허용되지 않은 메서드입니다: ${req.method}`);
}

export const server = createServer((req, res) => {
  applyCors(req, res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  route(req, res, url).catch((error) => {
    const status = error?.status ?? 500;
    if (status >= 500) console.error("[server]", error);
    if (!res.headersSent) fail(res, status, error?.message ?? "서버 오류");
  });
});

export async function start(port = PORT, host = HOST) {
  await storage.init();
  await new Promise((resolve) => server.listen(port, host, resolve));
  const actual = server.address();
  console.log(`[ERP backend] http://${host}:${typeof actual === "object" && actual ? actual.port : port}  data=${DATA_DIR}`);
  return server;
}

// 직접 실행된 경우에만 리스닝한다 (테스트에서 import 가능하게)
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  start();
}
