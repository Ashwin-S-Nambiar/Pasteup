const DB = 'pasteup';
const STORE = 'kept';

let opening;
function open() {
  if (!opening) {
    opening = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE, { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return opening;
}

async function run(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
  });
}

export const listKept = async () => {
  const all = (await run('readonly', (s) => s.getAll())) || [];
  return all.sort((a, b) => b.at - a.at);
};
export const putKept = (item) => run('readwrite', (s) => s.put(item));
export const deleteKept = (id) => run('readwrite', (s) => s.delete(id));
export const clearKept = () => run('readwrite', (s) => s.clear());
