import { createBaziReading } from '../core/bazi';
import type { BaziReading, BirthInput, ReadingPort } from '../core/types';

export class LocalReadingService implements ReadingPort {
  createReading(input: BirthInput) {
    return createBaziReading(input);
  }
}

export class RemoteReadingService implements ReadingPort {
  constructor(private readonly endpoint: string) {}

  createReading(input: BirthInput): BaziReading {
    throw new Error(`Remote reading service is not connected yet: ${this.endpoint}, ${input.birthDate}`);
  }
}

export const readingService = new LocalReadingService();
