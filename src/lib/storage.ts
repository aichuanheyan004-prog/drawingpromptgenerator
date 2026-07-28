export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface StorageBucket<T> {
  value: T[];
  available: boolean;
  save(next: T[]): boolean;
  clear(): boolean;
}

export const createStorageBucket = <T>(
  key: string,
  fallback: T[] = [],
  storage: StorageAdapter | null | undefined = getBrowserStorage()
): StorageBucket<T> => {
  if (!storage) {
    let memory = [...fallback];
    return {
      value: memory,
      available: false,
      save: (next) => {
        memory = [...next];
        return false;
      },
      clear: () => {
        memory = [];
        return false;
      }
    };
  }

  const value = readArray<T>(key, fallback, storage);
  return {
    value,
    available: true,
    save: (next) => {
      try {
        storage.setItem(key, JSON.stringify(next));
        return true;
      } catch {
        return false;
      }
    },
    clear: () => {
      try {
        storage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    }
  };
};

const readArray = <T>(key: string, fallback: T[], storage: StorageAdapter): T[] => {
  try {
    const raw = storage.getItem(key);
    if (!raw) {
      return [...fallback];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...fallback];
  } catch {
    return [...fallback];
  }
};

const getBrowserStorage = (): StorageAdapter | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }
  try {
    const testKey = "__dpg_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch {
    return undefined;
  }
};
