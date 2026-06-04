export interface StorageProvider<T> {
  save(key: string, data: T): void;
  load(key: string): T | null;
  remove(key: string): void;
  clear(): void;
}
