import { createBaziReading } from '../core/bazi';
import type { AnalysisContext, BirthInput, ReadingPort } from '../core/types';

export class LocalReadingService implements ReadingPort {
  async createReading(input: BirthInput, context?: AnalysisContext) {
    context?.signal?.throwIfAborted();
    return createBaziReading(input, context);
  }
}

export const readingService = new LocalReadingService();
