// 표준 ERP 포탈 백엔드 서버 — Desktop PC 기반 SQLite(WAL) DB + 정적 SPA 단일 포트 통합 서빙.
//
// 신뢰 경계: 브라우저에서 오는 모든 입력(경로 키, 본문)을 여기서 검증한다.
// EntityStore 인메모리 시뮬레이션 결과의 원자적 확정(Commit) 트랜잭션과 감사 로그(Audit Trail)를 제공한다.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, extname, join, resolve } from "node:path";
import { createStorage, isValidKey, validateEntities } from "./storage.mjs";
import { checkAuthz, identityFromHeaders, PERM_ORDER } from "./authz.mjs";
import { SELF_CONTAINED_RULES } from "../shared/businessRules.mjs";
import { callExaoneChat, getExaoneConfigStatus, updateExaoneRuntimeConfig } from "./exaone.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 5177);
const HOST = process.env.HOST ?? "127.0.0.1";
const DATA_DIR = process.env.DATA_DIR ?? join(HERE, "..", "data");
const DIST_DIR = resolve(process.env.DIST_DIR ?? join(HERE, "..", "dist"));

const DEV_PORTS = [5177, 5180, 5181, 5182, 5183, 8080];
const DEFAULT_ORIGINS = DEV_PORTS.flatMap((p) => [`http://localhost:${p}`, `http://127.0.0.1:${p}`]).join(",");
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? DEFAULT_ORIGINS)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const MAX_BODY_BYTES = 8 * 1024 * 1024;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const storage = createStorage(DATA_DIR);

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && (ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-ERP-User-Id, X-ERP-User-Role, X-ERP-User-Status");
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
  if (req.__body !== undefined) return Promise.resolve(req.__body);
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

function canApproveModule(identity, permissionRows, moduleId) {
  if (!identity?.role) return false;
  if (identity.status && identity.status !== "활성") return false;
  if (identity.role === "관리자") return true;
  const row = (permissionRows ?? []).find((r) => r?.role === identity.role);
  const level = row?.perms?.[moduleId];
  return PERM_ORDER.indexOf(level) >= PERM_ORDER.indexOf("승인");
}

const asId = (value) => (typeof value === "string" && value.length > 0 && value.length <= 128 ? value : null);

/**
 * 단일 포트 통합 운영을 위한 정적 SPA 서빙 핸들러 (dist/ 폴더 기준).
 */
async function serveStaticSpa(req, res, pathname) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return fail(res, 405, "허용되지 않은 메서드입니다.");
  }
  const cleanPath = pathname === "/" ? "/index.html" : pathname;
  const candidate = resolve(join(DIST_DIR, `.${cleanPath}`));
  if (!candidate.startsWith(DIST_DIR)) {
    return fail(res, 400, "잘못된 경로입니다.");
  }

  try {
    const info = await stat(candidate);
    if (info.isFile()) {
      const ext = extname(candidate).toLowerCase();
      const contentType = MIME_TYPES[ext] ?? "application/octet-stream";
      const content = await readFile(candidate);
      res.writeHead(200, { "Content-Type": contentType });
      res.end(req.method === "HEAD" ? undefined : content);
      return;
    }
  } catch {
    // 파일이 없고 확장자가 없는 경로면 SPA index.html 폴백
  }

  if (!extname(cleanPath)) {
    try {
      const indexHtml = await readFile(join(DIST_DIR, "index.html"));
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
      res.end(req.method === "HEAD" ? undefined : indexHtml);
      return;
    } catch {
      // dist 가 아직 빌드되지 않은 상태
    }
  }

  return fail(res, 404, "알 수 없는 경로입니다.");
}

async function route(req, res, url) {
  const segments = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
  if (segments[0] !== "api") {
    return serveStaticSpa(req, res, url.pathname);
  }

  if (segments[1] === "health" && req.method === "GET") {
    const all = await storage.readAll();
    const stats = await storage.getStats();
    return send(res, 200, { ok: true, keys: Object.keys(all).length, db: stats });
  }

  if (segments[1] === "snapshot" && req.method === "GET") {
    return send(res, 200, { ok: true, data: await storage.readAll() });
  }

  // 시뮬레이션 확정(Commit) 엔드포인트 — 프론트엔드 인메모리 시뮬레이션 값을 SQLite에 원자적으로 영속화
  if (segments[1] === "simulation" && segments[2] === "commit" && req.method === "POST") {
    const identity = identityFromHeaders(req.headers);
    const body = await readBody(req);
    if (!body || typeof body !== "object" || !body.stores || typeof body.stores !== "object") {
      return fail(res, 400, "확정할 stores 객체가 필요합니다.");
    }
    try {
      const committed = await storage.commitSimulation(body, identity);
      return send(res, 201, { ok: true, data: committed });
    } catch (error) {
      return fail(res, error.status ?? 500, error.message);
    }
  }

  // 시뮬레이션 확정 이력(History) 조회 엔드포인트
  if (segments[1] === "simulation" && segments[2] === "history" && req.method === "GET") {
    const moduleName = url.searchParams.get("module") || undefined;
    const limit = Number(url.searchParams.get("limit") || 50);
    const history = await storage.listConfirmedTransactions(moduleName, limit);
    return send(res, 200, { ok: true, data: history });
  }

  // 감사 로그(Audit Trail) 조회 엔드포인트
  if (segments[1] === "audit-logs" && req.method === "GET") {
    const storeKey = url.searchParams.get("storeKey") || undefined;
    const limit = Number(url.searchParams.get("limit") || 100);
    const logs = await storage.listAuditLogs(storeKey, limit);
    return send(res, 200, { ok: true, data: logs });
  }

  // 기준정보관리(MDM) 12종 물리 테이블 상태 조회 엔드포인트
  if (segments[1] === "mdm" && segments[2] === "status" && req.method === "GET") {
    const mdmStatus = await storage.getMdmStatus();
    return send(res, 200, { ok: true, data: mdmStatus });
  }

  // AI Copilot 2단계 Fallback — LG AI Research K-EXAONE 2.5 (k-exaone_v2.5) 설정 조회/변경 및 채팅 추론 엔드포인트
  if (segments[1] === "ai" && segments[2] === "exaone") {
    if (segments[3] === "config" && req.method === "GET") {
      return send(res, 200, { ok: true, data: getExaoneConfigStatus() });
    }
    if (segments[3] === "config" && req.method === "POST") {
      const body = await readBody(req);
      const updated = updateExaoneRuntimeConfig(body);
      return send(res, 200, { ok: true, data: updated });
    }
    if (segments[3] === "chat" && req.method === "POST") {
      const identity = identityFromHeaders(req.headers);
      const body = await readBody(req);
      if (!Array.isArray(body?.messages) || body.messages.length === 0) {
        return fail(res, 400, "messages 배열이 필요합니다.");
      }
      const result = await callExaoneChat({ ...body, storage, identity });
      return send(res, 200, result);
    }
  }

  // ID 순번 구간 예약
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

  // 문서번호 채번
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

  const identity = identityFromHeaders(req.headers);

  // 서버측 인가 및 업무 규칙 재검증
  if (req.method !== "GET") {
    const permissionRows = (await storage.read("platform.permission")) ?? [];
    const verdict = checkAuthz({ identity, permissionRows, key, method: req.method });
    if (!verdict.allowed) return fail(res, 403, `권한이 없습니다: ${verdict.reason}`);

    const rule = SELF_CONTAINED_RULES[key];
    if (rule && (req.method === "POST" || req.method === "PUT" || req.method === "PATCH")) {
      const body = await readBody(req);
      const docs =
        req.method === "PUT" ? (Array.isArray(body?.data) ? body.data : [])
        : req.method === "POST" ? (body?.row ? [body.row] : [])
        : (body?.patch ? [body.patch] : []);

      const canApprove = rule.approvalModule
        ? canApproveModule(identity, permissionRows, rule.approvalModule)
        : false;

      for (const [i, doc] of docs.entries()) {
        const outcome = rule.check(doc ?? {}, { canApprove });
        if (!outcome.ok) {
          return fail(res, 422, `업무 규칙 위반 [${outcome.ruleId}] ${docs.length > 1 ? `${i + 1}번째 행: ` : ""}${outcome.message}`);
        }
      }
      req.__body = body;
    }
  }

  if (req.method === "GET" && !rowId) {
    return send(res, 200, { ok: true, data: (await storage.read(key)) ?? [] });
  }

  if (req.method === "PUT" && !rowId) {
    const body = await readBody(req);
    const invalid = validateEntities(body?.data);
    if (invalid) return fail(res, 400, invalid);
    const saved = await storage.write(key, body.data, identity, "PUT");
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
      const next = await storage.mutate(
        key,
        (current) => {
          if (current.some((r) => r.id === row.id)) {
            throw Object.assign(new Error(`이미 존재하는 id 입니다: ${row.id}`), { status: 409 });
          }
          return [row, ...current];
        },
        identity,
        "POST",
        row.id
      );
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
    const { id: _ignored, ...safePatch } = patch;
    try {
      let found = false;
      const next = await storage.mutate(
        key,
        (current) =>
          current.map((r) => {
            if (r.id !== rowId) return r;
            found = true;
            return { ...r, ...safePatch, id: rowId };
          }),
        identity,
        "PATCH",
        rowId
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
    const next = await storage.mutate(
      key,
      (current) => current.filter((r) => !targets.has(r.id)),
      identity,
      "DELETE",
      ids.join(",")
    );
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

server.on("close", () => {
  storage.close();
});

export async function start(port = PORT, host = HOST) {
  await storage.init();
  await new Promise((resolve) => server.listen(port, host, resolve));
  const actual = server.address();
  console.log(
    `[ERP SQLite Server] http://${host}:${typeof actual === "object" && actual ? actual.port : port}  db=${join(DATA_DIR, "erp.db")}`
  );
  return server;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  start();
}
