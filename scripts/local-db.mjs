// Postgres chạy LOCAL để dev/test không đụng Supabase. Dữ liệu nằm ở `.localdb/` (đã gitignore), cổng 55432, chỉ nghe localhost.
// Dùng:  node scripts/local-db.mjs <init|start|stop|status>   (hoặc `pnpm db:local <lệnh>`)
// Cần PostgreSQL cài sẵn trên máy (tự dò trong C:\Program Files\PostgreSQL\<phiên bản>\bin, hoặc đặt PG_BIN).
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DATA = join(ROOT, ".localdb", "data");
const LOG = join(ROOT, ".localdb", "postgres.log");
const PORT = "55432";
const DATABASES = ["corelink_local", "corelink_local_test"];

function findBin() {
  if (process.env.PG_BIN) return process.env.PG_BIN;
  const base = "C:\\Program Files\\PostgreSQL";
  if (existsSync(base)) {
    const versions = readdirSync(base).filter((v) => /^\d+$/.test(v)).sort((a, b) => Number(b) - Number(a));
    for (const v of versions) if (existsSync(join(base, v, "bin", "pg_ctl.exe"))) return join(base, v, "bin");
  }
  return null; // dùng PATH
}

const bin = findBin();
const exe = (name) => (bin ? join(bin, name) : name);

// stdio "ignore": tiến trình postgres con không giữ ống dẫn của terminal/công cụ gọi (nếu giữ, lệnh sẽ treo).
function run(name, args, { capture = false } = {}) {
  const r = spawnSync(exe(name), args, { encoding: "utf8", stdio: capture ? ["ignore", "pipe", "pipe"] : "ignore", windowsHide: true });
  if (r.error) {
    console.error(`Không chạy được ${name}: ${r.error.message}\nCài PostgreSQL hoặc đặt biến PG_BIN trỏ tới thư mục bin.`);
    process.exit(1);
  }
  return r;
}

const isRunning = () => run("pg_ctl", ["-D", DATA, "status"]).status === 0;

function start() {
  if (isRunning()) return console.log(`Postgres local đang chạy (cổng ${PORT}).`);
  const r = run("pg_ctl", ["-D", DATA, "-o", `-p ${PORT}`, "-l", LOG, "-w", "-t", "60", "start"]);
  if (r.status !== 0) {
    console.error(`Không khởi động được Postgres local. Xem log: ${LOG}`);
    process.exit(1);
  }
  console.log(`Postgres local đã chạy (cổng ${PORT}).`);
}

function stop() {
  if (!isRunning()) return console.log("Postgres local chưa chạy.");
  run("pg_ctl", ["-D", DATA, "-m", "fast", "-w", "stop"]);
  console.log("Đã dừng Postgres local.");
}

function init() {
  if (!existsSync(join(DATA, "PG_VERSION"))) {
    const r = run("initdb", ["-D", DATA, "-U", "postgres", "-A", "trust", "-E", "UTF8", "--locale=C"]);
    if (r.status !== 0) {
      console.error("initdb thất bại.");
      process.exit(1);
    }
    // UTC giống Supabase: bộ giới hạn tốc độ so sánh `timestamp` không múi giờ nên lệch nếu để múi giờ máy.
    appendFileSync(join(DATA, "postgresql.conf"), `\nlisten_addresses = 'localhost'\ntimezone = 'UTC'\nlog_timezone = 'UTC'\n`);
    console.log("Đã tạo cụm Postgres local trong .localdb/data");
  }
  start();
  const existing = run("psql", ["-p", PORT, "-U", "postgres", "-d", "postgres", "-tAc", "SELECT datname FROM pg_database"], { capture: true }).stdout.split(/\r?\n/);
  for (const name of DATABASES) {
    if (existing.includes(name)) continue;
    run("createdb", ["-p", PORT, "-U", "postgres", name]);
    console.log(`Đã tạo database ${name}`);
  }
  console.log(`\nXong. DATABASE_URL=postgresql://postgres@localhost:${PORT}/corelink_local`);
}

const commands = { init, start, stop, status: () => console.log(isRunning() ? `Đang chạy (cổng ${PORT}).` : "Chưa chạy.") };
const cmd = process.argv[2];
if (!commands[cmd]) {
  console.error("Dùng: node scripts/local-db.mjs <init|start|stop|status>");
  process.exit(1);
}
commands[cmd]();
