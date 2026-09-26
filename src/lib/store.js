import { useSyncExternalStore } from 'react';

export function createStore(initial) {
  let state = initial;
  const listeners = new Set();
  return {
    get: () => state,
    set(next) {
      state = typeof next === 'function' ? next(state) : next;
      for (const l of listeners) l();
    },
    subscribe(l) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

export function createPersistedStore(key, initial) {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(key));
  } catch {}
  const store = createStore(saved ?? initial);
  store.subscribe(() => {
    try {
      localStorage.setItem(key, JSON.stringify(store.get()));
    } catch {}
  });
  return store;
}

export const useStore = (store) =>
  useSyncExternalStore(store.subscribe, store.get, store.get);

export const toastStore = createStore([]);
let nextToast = 1;

export function toast({ title, body, tone = 'info', duration = 3200 }) {
  const id = nextToast++;
  toastStore.set((list) => [...list.slice(-2), { id, title, body, tone }]);
  setTimeout(() => dismissToast(id), duration);
  return id;
}

export const dismissToast = (id) =>
  toastStore.set((list) => list.filter((t) => t.id !== id));

export function haptic(ms = 8) {
  try {
    navigator.vibrate?.(ms);
  } catch {}
}
