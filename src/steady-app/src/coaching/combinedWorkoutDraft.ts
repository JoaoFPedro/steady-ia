import type { RecordQueue } from '../sync/recordQueue';
import type { StrengthExecutionPayload } from './workoutExecution';

export type RunningExecutionPayload = {
  date: string;
  distanceKm: number;
  durationMinutes: number;
  averagePaceMinPerKm: number;
  perceivedEffort: number;
  painReported?: boolean;
};

export interface CombinedDraftStorage {
  read(): Promise<StrengthExecutionPayload | null>;
  write(value: StrengthExecutionPayload): Promise<void>;
  clear(): Promise<void>;
}

export class CombinedWorkoutDrafts {
  constructor(
    private readonly storage: CombinedDraftStorage,
    private readonly queue: RecordQueue,
  ) {}

  hold(strength: StrengthExecutionPayload): Promise<void> {
    return this.storage.write(strength);
  }

  async completeWithRun(running: RunningExecutionPayload): Promise<void> {
    const strength = await this.storage.read();
    if (strength === null) throw new Error('Não há musculação aguardando corrida.');

    const hasPainAnswer = strength.painReported !== undefined || running.painReported !== undefined;
    const painReported = strength.painReported === true || running.painReported === true;
    await this.queue.enqueue('combinedWorkout', {
      strength: hasPainAnswer ? { ...strength, painReported } : strength,
      running,
    });
    await this.storage.clear();
  }

  async finishStrengthOnly(): Promise<boolean> {
    const strength = await this.storage.read();
    if (strength === null) return false;

    await this.queue.enqueue('strengthWorkout', strength);
    await this.storage.clear();
    return true;
  }

  recover(): Promise<boolean> {
    return this.finishStrengthOnly();
  }

  async hasPending(): Promise<boolean> {
    return (await this.storage.read()) !== null;
  }

  clear(): Promise<void> {
    return this.storage.clear();
  }
}
