/* Glass Pattern Studio — tiny IndexedDB wrapper. Store "projects": one record per pattern (photo, crop, settings, built pattern, thumbnail). Everything stays on the device. */
const DB = (() => {
  let dbp;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('glass-pattern-studio', 1);
    r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('projects')) d.createObjectStore('projects', { keyPath: 'id' }).createIndex('updated', 'updated'); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const tx = async (mode, fn) => { const d = await open(); return new Promise((res, rej) => { const t = d.transaction('projects', mode), s = t.objectStore('projects'); let out; const q = fn(s); if (q) q.onsuccess = () => { out = q.result; }; t.oncomplete = () => res(out); t.onerror = () => rej(t.error || new Error('Storage error')); t.onabort = () => rej(t.error || new Error('Storage full — delete a project and try again')); }); };
  return { put: v => tx('readwrite', s => s.put(v)), get: k => tx('readonly', s => s.get(k)), del: k => tx('readwrite', s => s.delete(k)), all: () => tx('readonly', s => s.getAll()) };
})();
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
