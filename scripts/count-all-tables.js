const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

const sql = fs.readFileSync(path.join(__dirname, '..', 'db', '000_schema.sql'), 'utf8');
const tables = [...sql.matchAll(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?([a-zA-Z0-9_]+)/gi)].map(m => m[1]);

async function checkAll() {
  const counts = {};
  for (const t of tables) {
    try {
      const res = await prisma.$queryRawUnsafe('SELECT COUNT(*) as cnt FROM ' + t);
      counts[t] = Number(res[0].cnt);
    } catch (e) {
      counts[t] = 'LỖI: ' + e.message;
    }
  }
  fs.writeFileSync(path.join(__dirname, 'table-counts.json'), JSON.stringify(counts, null, 2), 'utf8');
  console.log('Successfully counted all', tables.length, 'tables!');
}

checkAll().finally(() => prisma.$disconnect());
