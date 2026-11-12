// SQLite (WAL 모드) 온라인 무중단 백업 유틸리티
// 서버가 가동 중인 상태에서도 WAL 체크포인트 및 안전한 백업본을 생성한다.
import { DatabaseSync, backup } from "node:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { openSqliteDatabase } from "../server/db.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(process.env.DATA_DIR ?? join(HERE, "..", "data"));
const BACKUP_DIR = resolve(process.env.BACKUP_DIR ?? join(HERE, "..", "..", "backups"));
const sourcePath = join(DATA_DIR, "erp.db");

mkdirSync(DATA_DIR, { recursive: true });
mkdirSync(BACKUP_DIR, { recursive: true });

if (!existsSync(sourcePath)) {
  console.log(`[SQLite Backup] 원본 DB 파일을 초기화합니다 (${sourcePath}).`);
  const initDb = openSqliteDatabase(sourcePath);
  initDb.close();
}

const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
const destPath = join(BACKUP_DIR, `erp_backup_${stamp}.db`);

const srcDb = new DatabaseSync(sourcePath);
try {
  await backup(srcDb, destPath);
  console.log(`[SQLite Backup] ✅ 온라인 백업 완료: ${destPath}`);
} finally {
  srcDb.close();
}
