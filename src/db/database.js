// @ts-nocheck
import initSqlJs from 'sql.js';
import wasmURL from 'sql.js/dist/sql-wasm.wasm?url';

const DB_STORAGE_KEY = 'hacknet-local-sqlite';
const ENTITY_NAMES = ['Extension', 'Faction', 'HackerScript', 'HacknetNode', 'Mission', 'NodeAction', 'NodeLink', 'NodePerson'];

let SQL;
let dbSqlite;
let dbReady;

const initDb = async () => {
  SQL = await initSqlJs({ locateFile: () => wasmURL });
  const stored = localStorage.getItem(DB_STORAGE_KEY);
  if (stored) {
    const bytes = Uint8Array.from(JSON.parse(stored));
    dbSqlite = new SQL.Database(bytes);
  } else {
    dbSqlite = new SQL.Database();
  }

  dbSqlite.run(`CREATE TABLE IF NOT EXISTS entities (
    id TEXT PRIMARY KEY,
    entity TEXT NOT NULL,
    extension_id TEXT,
    data TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);

  // Seed local database one-time (se popula só quando vazio)
  try {
    const { seedDatabase } = await import('@/db/seedData');
    seedDatabase(dbSqlite);
  } catch (seedError) {
    console.warn('Falha ao semear dados iniciais:', seedError);
  }

  persistDb();
};

const getDb = async () => {
  if (!dbReady) {
    dbReady = initDb();
  }
  await dbReady;
  return dbSqlite;
};

const persistDb = () => {
  if (!dbSqlite) return;
  const data = dbSqlite.export();
  localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(Array.from(data)));
};

const parseResult = (result) => {
  if (!result || !result.values || result.values.length === 0) return [];
  const columnIndex = result.columns.reduce((map, col, i) => ({ ...map, [col]: i }), {});
  return result.values.map((valueRow) => {
    const data = JSON.parse(valueRow[columnIndex.data]);
    return data;
  });
};

const createEntityClient = (entityName) => ({
  list: async () => {
    const dbRef = await getDb();
    const stmt = dbRef.prepare('SELECT data FROM entities WHERE entity = :entity ORDER BY created_at DESC');
    stmt.bind({ ':entity': entityName });
    const rows = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      rows.push(JSON.parse(row.data));
    }
    stmt.free();
    return rows;
  },

  filter: async (filters = {}) => {
    const rows = await db.entities[entityName].list();
    return rows.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null) return true;
        return item[key] === value;
      });
    });
  },

  create: async (newData) => {
    const dbRef = await getDb();
    const now = Date.now();
    const id = newData.id || (`${entityName.toLowerCase()}_${now}_${Math.floor(Math.random() * 100000)}`);
    const record = {
      ...newData,
      id,
      created_at: now,
      updated_at: now,
    };

    const stmt = dbRef.prepare('INSERT OR REPLACE INTO entities (id, entity, extension_id, data, created_at, updated_at) VALUES (:id, :entity, :extension_id, :data, :created_at, :updated_at)');
    stmt.bind({
      ':id': id,
      ':entity': entityName,
      ':extension_id': record.extension_id || null,
      ':data': JSON.stringify(record),
      ':created_at': now,
      ':updated_at': now,
    });
    stmt.step();
    stmt.free();
    persistDb();
    return record;
  },

  update: async (id, data) => {
    const dbRef = await getDb();
    const existing = await db.entities[entityName].filter({ id });
    if (!existing || existing.length === 0) {
      throw new Error(`${entityName} with id ${id} not found`);
    }
    const now = Date.now();
    const updated = {
      ...existing[0],
      ...data,
      id,
      updated_at: now,
    };

    const stmt = dbRef.prepare('UPDATE entities SET extension_id = :extension_id, data = :data, updated_at = :updated_at WHERE id = :id');
    stmt.bind({
      ':id': id,
      ':extension_id': updated.extension_id || null,
      ':data': JSON.stringify(updated),
      ':updated_at': now,
    });
    stmt.step();
    stmt.free();
    persistDb();
    return updated;
  },

  delete: async (id) => {
    const dbRef = await getDb();
    const stmt = dbRef.prepare('DELETE FROM entities WHERE id = :id');
    stmt.bind({ ':id': id });
    stmt.step();
    stmt.free();
    persistDb();
    return true;
  },
});

export const db = {
  auth: {
    me: async () => {
      await getDb();
      const userJson = localStorage.getItem('local-user');
      if (userJson) return JSON.parse(userJson);
      const defaultUser = { id: 'admin', name: 'Admin', role: 'admin' };
      localStorage.setItem('local-user', JSON.stringify(defaultUser));
      return defaultUser;
    },
    logout: () => {
      localStorage.removeItem('local-user');
    },
    redirectToLogin: () => {
      // no external auth flow in local mode
      return;
    },
  },
  entities: {},
};

ENTITY_NAMES.forEach((entity) => {
  db.entities[entity] = createEntityClient(entity);
});

