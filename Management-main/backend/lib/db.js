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
  'seller_returns',
  'company_payments',
  'operational_costs',
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

async function ensureTable(tableName, createTable) {
  const tableExists = await db.schema.hasTable(tableName);
  if (tableExists) return;
  await db.schema.createTable(tableName, createTable);
}

async function ensureColumn(tableName, columnName, addColumn) {
  const columnExists = await db.schema.hasColumn(tableName, columnName);
  if (columnExists) return;
  await db.schema.alterTable(tableName, addColumn);
}

async function ensureSchema() {
  await ensureTable('users', (table) => {
    table.increments('id').primary();
    table.string('uid', 255).notNullable().unique();
    table.string('name', 255).notNullable();
    table.string('email', 255).notNullable().unique();
    table.text('password').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(db.fn.now());
  });

  await ensureTable('sellers', (table) => {
    table.increments('id').primary();
    table.string('owner_uid', 255).notNullable();
    table.string('name', 255).notNullable();
    table.string('phone', 255);
    table.text('address');
    table.boolean('bad_quality').notNullable().defaultTo(false);
    table.timestamp('created_at').notNullable().defaultTo(db.fn.now());
    table.unique(['owner_uid', 'name']);
  });

  await ensureTable('companies', (table) => {
    table.increments('id').primary();
    table.string('owner_uid', 255).notNullable();
    table.string('name', 255).notNullable();
    table.string('contact_person', 255);
    table.string('phone', 255);
    table.text('address');
    table.boolean('bad_credit').notNullable().defaultTo(false);
    table.timestamp('created_at').notNullable().defaultTo(db.fn.now());
    table.unique(['owner_uid', 'name']);
  });

  await ensureTable('inventory_lots', (table) => {
    table.increments('id').primary();
    table.string('owner_uid', 255).notNullable();
    table.integer('seller_id').references('sellers.id').onDelete('SET NULL');
    table.string('product_name', 255).notNullable();
    table.string('color', 255);
    table.string('quality', 255);
    table.text('image_url');
    table.date('purchase_date').notNullable();
    table.decimal('bought_weight_tons', 12, 3).notNullable();
    table.decimal('cost_per_ton', 14, 2).notNullable();
    table.string('location', 255);
    table.text('notes');
    table.timestamp('created_at').notNullable().defaultTo(db.fn.now());
  });

  await ensureTable('sales', (table) => {
    table.increments('id').primary();
    table.string('owner_uid', 255).notNullable();
    table.integer('lot_id').notNullable().references('inventory_lots.id').onDelete('CASCADE');
    table.integer('company_id').notNullable().references('companies.id').onDelete('CASCADE');
    table.date('sale_date').notNullable();
    table.decimal('sold_weight_tons', 12, 3).notNullable();
    table.decimal('price_per_ton', 14, 2).notNullable();
    table.string('location', 255);
    table.text('notes');
    table.timestamp('created_at').notNullable().defaultTo(db.fn.now());
  });

  await ensureTable('seller_payments', (table) => {
    table.increments('id').primary();
    table.string('owner_uid', 255).notNullable();
    table.integer('lot_id').notNullable().references('inventory_lots.id').onDelete('CASCADE');
    table.decimal('amount', 14, 2).notNullable();
    table.string('payment_method', 50).notNullable();
    table.date('payment_date').notNullable();
    table.text('note');
    table.timestamp('created_at').notNullable().defaultTo(db.fn.now());
  });

  await ensureTable('seller_returns', (table) => {
    table.increments('id').primary();
    table.string('owner_uid', 255).notNullable();
    table.integer('seller_id').notNullable().references('sellers.id').onDelete('CASCADE');
    table.integer('lot_id').notNullable().references('inventory_lots.id').onDelete('CASCADE');
    table.decimal('return_weight_tons', 12, 3).notNullable();
    table.decimal('return_amount', 14, 2).notNullable().defaultTo(0);
    table.text('return_reason');
    table.date('return_date').notNullable().defaultTo(db.fn.now());
    table.timestamp('created_at').notNullable().defaultTo(db.fn.now());
  });

  await ensureTable('company_payments', (table) => {
    table.increments('id').primary();
    table.string('owner_uid', 255).notNullable();
    table.integer('sale_id').notNullable().references('sales.id').onDelete('CASCADE');
    table.decimal('amount', 14, 2).notNullable();
    table.string('payment_method', 50).notNullable();
    table.date('payment_date').notNullable();
    table.text('note');
    table.timestamp('created_at').notNullable().defaultTo(db.fn.now());
  });

  await ensureTable('operational_costs', (table) => {
    table.increments('id').primary();
    table.string('owner_uid', 255).notNullable();
    table.string('category', 50).notNullable();
    table.string('cost_type', 120).notNullable().defaultTo('general');
    table.decimal('quantity', 12, 3).notNullable().defaultTo(1);
    table.decimal('unit_cost', 14, 2);
    table.decimal('amount', 14, 2).notNullable();
    table.date('cost_date').notNullable();
    table.text('note');
    table.timestamp('created_at').notNullable().defaultTo(db.fn.now());
  });

  await ensureColumn('users', 'created_at', (table) => {
    table.timestamp('created_at').defaultTo(db.fn.now());
  });

  await ensureColumn('sellers', 'owner_uid', (table) => {
    table.string('owner_uid', 255);
  });
  await ensureColumn('sellers', 'phone', (table) => {
    table.string('phone', 255);
  });
  await ensureColumn('sellers', 'address', (table) => {
    table.text('address');
  });
  await ensureColumn('sellers', 'bad_quality', (table) => {
    table.boolean('bad_quality').notNullable().defaultTo(false);
  });
  await ensureColumn('sellers', 'created_at', (table) => {
    table.timestamp('created_at').defaultTo(db.fn.now());
  });

  await ensureColumn('companies', 'owner_uid', (table) => {
    table.string('owner_uid', 255);
  });
  await ensureColumn('companies', 'contact_person', (table) => {
    table.string('contact_person', 255);
  });
  await ensureColumn('companies', 'phone', (table) => {
    table.string('phone', 255);
  });
  await ensureColumn('companies', 'address', (table) => {
    table.text('address');
  });
  await ensureColumn('companies', 'bad_credit', (table) => {
    table.boolean('bad_credit').notNullable().defaultTo(false);
  });
  await ensureColumn('companies', 'created_at', (table) => {
    table.timestamp('created_at').defaultTo(db.fn.now());
  });

  await ensureColumn('inventory_lots', 'owner_uid', (table) => {
    table.string('owner_uid', 255);
  });
  await ensureColumn('inventory_lots', 'seller_id', (table) => {
    table.integer('seller_id');
  });
  await ensureColumn('inventory_lots', 'product_name', (table) => {
    table.string('product_name', 255);
  });
  await ensureColumn('inventory_lots', 'color', (table) => {
    table.string('color', 255);
  });
  await ensureColumn('inventory_lots', 'quality', (table) => {
    table.string('quality', 255);
  });
  await ensureColumn('inventory_lots', 'image_url', (table) => {
    table.text('image_url');
  });
  await ensureColumn('inventory_lots', 'purchase_date', (table) => {
    table.date('purchase_date');
  });
  await ensureColumn('inventory_lots', 'bought_weight_tons', (table) => {
    table.decimal('bought_weight_tons', 12, 3);
  });
  await ensureColumn('inventory_lots', 'cost_per_ton', (table) => {
    table.decimal('cost_per_ton', 14, 2);
  });
  await ensureColumn('inventory_lots', 'location', (table) => {
    table.string('location', 255);
  });
  await ensureColumn('inventory_lots', 'notes', (table) => {
    table.text('notes');
  });
  await ensureColumn('inventory_lots', 'created_at', (table) => {
    table.timestamp('created_at').defaultTo(db.fn.now());
  });

  await ensureColumn('sales', 'owner_uid', (table) => {
    table.string('owner_uid', 255);
  });
  await ensureColumn('sales', 'lot_id', (table) => {
    table.integer('lot_id');
  });
  await ensureColumn('sales', 'company_id', (table) => {
    table.integer('company_id');
  });
  await ensureColumn('sales', 'sale_date', (table) => {
    table.date('sale_date');
  });
  await ensureColumn('sales', 'sold_weight_tons', (table) => {
    table.decimal('sold_weight_tons', 12, 3);
  });
  await ensureColumn('sales', 'price_per_ton', (table) => {
    table.decimal('price_per_ton', 14, 2);
  });
  await ensureColumn('sales', 'location', (table) => {
    table.string('location', 255);
  });
  await ensureColumn('sales', 'notes', (table) => {
    table.text('notes');
  });
  await ensureColumn('sales', 'created_at', (table) => {
    table.timestamp('created_at').defaultTo(db.fn.now());
  });

  await ensureColumn('seller_payments', 'owner_uid', (table) => {
    table.string('owner_uid', 255);
  });
  await ensureColumn('seller_payments', 'lot_id', (table) => {
    table.integer('lot_id');
  });
  await ensureColumn('seller_payments', 'amount', (table) => {
    table.decimal('amount', 14, 2);
  });
  await ensureColumn('seller_payments', 'payment_method', (table) => {
    table.string('payment_method', 50);
  });
  await ensureColumn('seller_payments', 'payment_date', (table) => {
    table.date('payment_date');
  });
  await ensureColumn('seller_payments', 'note', (table) => {
    table.text('note');
  });
  await ensureColumn('seller_payments', 'created_at', (table) => {
    table.timestamp('created_at').defaultTo(db.fn.now());
  });

  await ensureColumn('seller_returns', 'owner_uid', (table) => {
    table.string('owner_uid', 255);
  });
  await ensureColumn('seller_returns', 'seller_id', (table) => {
    table.integer('seller_id');
  });
  await ensureColumn('seller_returns', 'lot_id', (table) => {
    table.integer('lot_id');
  });
  await ensureColumn('seller_returns', 'return_weight_tons', (table) => {
    table.decimal('return_weight_tons', 12, 3);
  });
  await ensureColumn('seller_returns', 'return_amount', (table) => {
    table.decimal('return_amount', 14, 2).notNullable().defaultTo(0);
  });
  await ensureColumn('seller_returns', 'return_reason', (table) => {
    table.text('return_reason');
  });
  await ensureColumn('seller_returns', 'return_date', (table) => {
    table.date('return_date');
  });
  await ensureColumn('seller_returns', 'created_at', (table) => {
    table.timestamp('created_at').defaultTo(db.fn.now());
  });

  await ensureColumn('company_payments', 'owner_uid', (table) => {
    table.string('owner_uid', 255);
  });
  await ensureColumn('company_payments', 'sale_id', (table) => {
    table.integer('sale_id');
  });
  await ensureColumn('company_payments', 'amount', (table) => {
    table.decimal('amount', 14, 2);
  });
  await ensureColumn('company_payments', 'payment_method', (table) => {
    table.string('payment_method', 50);
  });
  await ensureColumn('company_payments', 'payment_date', (table) => {
    table.date('payment_date');
  });
  await ensureColumn('company_payments', 'note', (table) => {
    table.text('note');
  });
  await ensureColumn('company_payments', 'created_at', (table) => {
    table.timestamp('created_at').defaultTo(db.fn.now());
  });

  await ensureColumn('operational_costs', 'owner_uid', (table) => {
    table.string('owner_uid', 255);
  });
  await ensureColumn('operational_costs', 'category', (table) => {
    table.string('category', 50);
  });
  await ensureColumn('operational_costs', 'cost_type', (table) => {
    table.string('cost_type', 120);
  });
  await ensureColumn('operational_costs', 'quantity', (table) => {
    table.decimal('quantity', 12, 3).notNullable().defaultTo(1);
  });
  await ensureColumn('operational_costs', 'unit_cost', (table) => {
    table.decimal('unit_cost', 14, 2);
  });
  await ensureColumn('operational_costs', 'amount', (table) => {
    table.decimal('amount', 14, 2);
  });
  await ensureColumn('operational_costs', 'cost_date', (table) => {
    table.date('cost_date');
  });
  await ensureColumn('operational_costs', 'note', (table) => {
    table.text('note');
  });
  await ensureColumn('operational_costs', 'created_at', (table) => {
    table.timestamp('created_at').defaultTo(db.fn.now());
  });

  await db.raw('CREATE UNIQUE INDEX IF NOT EXISTS sellers_owner_uid_name_unique ON sellers (owner_uid, name)');
  await db.raw('CREATE UNIQUE INDEX IF NOT EXISTS companies_owner_uid_name_unique ON companies (owner_uid, name)');
  await db.raw('CREATE INDEX IF NOT EXISTS inventory_lots_owner_uid_idx ON inventory_lots (owner_uid)');
  await db.raw('CREATE INDEX IF NOT EXISTS inventory_lots_seller_id_idx ON inventory_lots (seller_id)');
  await db.raw('CREATE INDEX IF NOT EXISTS sales_owner_uid_idx ON sales (owner_uid)');
  await db.raw('CREATE INDEX IF NOT EXISTS sales_lot_id_idx ON sales (lot_id)');
  await db.raw('CREATE INDEX IF NOT EXISTS sales_company_id_idx ON sales (company_id)');
  await db.raw('CREATE INDEX IF NOT EXISTS seller_payments_owner_uid_idx ON seller_payments (owner_uid)');
  await db.raw('CREATE INDEX IF NOT EXISTS seller_payments_lot_id_idx ON seller_payments (lot_id)');
  await db.raw('CREATE INDEX IF NOT EXISTS company_payments_owner_uid_idx ON company_payments (owner_uid)');
  await db.raw('CREATE INDEX IF NOT EXISTS company_payments_sale_id_idx ON company_payments (sale_id)');
  await db.raw('CREATE INDEX IF NOT EXISTS seller_returns_owner_uid_idx ON seller_returns (owner_uid)');
  await db.raw('CREATE INDEX IF NOT EXISTS seller_returns_seller_id_idx ON seller_returns (seller_id)');
  await db.raw('CREATE INDEX IF NOT EXISTS seller_returns_lot_id_idx ON seller_returns (lot_id)');
  await db.raw('CREATE INDEX IF NOT EXISTS operational_costs_owner_uid_idx ON operational_costs (owner_uid)');
  await db.raw('CREATE INDEX IF NOT EXISTS operational_costs_cost_date_idx ON operational_costs (cost_date)');
  await db.raw('CREATE INDEX IF NOT EXISTS operational_costs_cost_type_idx ON operational_costs (cost_type)');
}

export async function initDb() {
  await ensureSchema();
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
