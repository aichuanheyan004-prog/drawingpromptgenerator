export interface RandomSource {
  next(): number;
}

export class SeededRandom implements RandomSource {
  private state: number;

  constructor(seed: string | number) {
    this.state = normalizeSeed(seed);
  }

  next(): number {
    this.state += 0x6d2b79f5;
    let value = this.state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }
}

export const randomId = (random: RandomSource = MathRandomSource): string => {
  const value = Math.floor(random.next() * Number.MAX_SAFE_INTEGER).toString(36);
  return `dpg_${value.padStart(10, "0")}`;
};

export const pick = <T>(items: readonly T[], random: RandomSource): T => {
  if (items.length === 0) {
    throw new Error("Cannot pick from an empty prompt pool.");
  }
  return items[Math.floor(random.next() * items.length)];
};

export const MathRandomSource: RandomSource = {
  next: () => Math.random()
};

const normalizeSeed = (seed: string | number): number => {
  if (typeof seed === "number") {
    return seed >>> 0;
  }

  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};
