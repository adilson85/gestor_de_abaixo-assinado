const draftStore = new Map<string, unknown>();

export const getFormDraft = <T>(key: string): T | null => {
  if (!draftStore.has(key)) {
    return null;
  }

  return draftStore.get(key) as T;
};

export const setFormDraft = <T>(key: string, value: T): void => {
  draftStore.set(key, value);
};

export const clearFormDraft = (key: string): void => {
  draftStore.delete(key);
};

export const hasFormDraft = (key: string): boolean => draftStore.has(key);
