import { useState, useEffect } from "react";
import { HealthRecord, MemoryVector } from "../types";
import { StorageProvider } from "../types/storage";

export class LocalStorageProvider<T> implements StorageProvider<T> {
  save(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  load(key: string): T | null {
    const value = localStorage.getItem(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}

export function useStorage() {
  const recordProvider = new LocalStorageProvider<HealthRecord[]>();
  const vectorProvider = new LocalStorageProvider<MemoryVector[]>();

  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [vectors, setVectors] = useState<MemoryVector[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load records and vectors on mount
  useEffect(() => {
    const storedRecords = recordProvider.load("aayu_records") || [];
    const storedVectors = vectorProvider.load("aayu_vectors") || [];
    setRecords(storedRecords);
    setVectors(storedVectors);
    setHasLoaded(true);
  }, []);

  // Persist records when state changes
  useEffect(() => {
    if (!hasLoaded) return;
    recordProvider.save("aayu_records", records);
  }, [records, hasLoaded]);

  // Persist vectors when state changes
  useEffect(() => {
    if (!hasLoaded) return;
    vectorProvider.save("aayu_vectors", vectors);
  }, [vectors, hasLoaded]);

  const saveRecord = (record: HealthRecord, vectorMap: Record<string, number>) => {
    setRecords((prev) => [record, ...prev]);
    setVectors((prev) => [
      {
        id: record.id,
        vector: vectorMap,
      },
      ...prev,
    ]);
  };

  const deleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setVectors((prev) => prev.filter((v) => v.id !== id));
  };

  return {
    records,
    vectors,
    saveRecord,
    deleteRecord,
    hasLoaded,
  };
}
