import Dexie from 'dexie';

export const db = new Dexie('CrewRosterDB');

db.version(1).stores({
  people: 'id, name, phone, ts',
  settings: 'key',
});

export async function dbLoad(key) {
  try {
    const r = await db.settings.get(key);
    return r ? JSON.parse(r.value) : null;
  } catch {
    return null;
  }
}

export async function dbSave(key, data) {
  try {
    await db.settings.put({ key, value: JSON.stringify(data) });
  } catch (e) {
    console.error(e);
  }
}

export async function dbDelete(key) {
  try {
    await db.settings.delete(key);
  } catch (e) {
    console.error(e);
  }
}
