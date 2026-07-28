import { describe, expect, it } from "vitest";
import { createStorageBucket, type StorageAdapter } from "../src/lib/storage";

describe("storage bucket", () => {
  it("falls back to memory when storage is unavailable", () => {
    const bucket = createStorageBucket<string>("missing", ["one"], null);
    expect(bucket.available).toBe(false);
    expect(bucket.value).toEqual(["one"]);
    expect(bucket.save(["two"])).toBe(false);
    expect(bucket.clear()).toBe(false);
  });

  it("handles broken localStorage without throwing", () => {
    const broken: StorageAdapter = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      }
    };
    const bucket = createStorageBucket<string>("broken", ["fallback"], broken);
    expect(bucket.value).toEqual(["fallback"]);
    expect(bucket.save(["next"])).toBe(false);
    expect(bucket.clear()).toBe(false);
  });
});
