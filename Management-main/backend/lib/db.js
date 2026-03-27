import knex from 'knex';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const REQUIRED_TABLES = [
  'users',
  'sellers',
  'companies',
  'inventory_lots',
  'sales',
  'seller_payments',
  'company_payments',
];

const db = knex({
  client: 'pg',
  connection: {
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  },
  pool: {
    min: 0,
    max: 10,
  },
});

export async function initDb() {
  const missingTables = [];

  for (const tableName of REQUIRED_TABLES) {
    const exists = await db.schema.hasTable(tableName);
    if (!exists) {
      missingTables.push(tableName);
    }
  }

  if (missingTables.length > 0) {
    throw new Error(
      `Database schema is incomplete. Missing tables: ${missingTables.join(', ')}`
    );
  }
}

export default db;
