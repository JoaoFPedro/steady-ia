import type { QueryResult } from '../api/queryApi';

export type Account = { id: string; roles: string[] };
export type WorkoutType = 'push' | 'pull' | 'lower' | 'run';

export type ExercisePrescription = {
  id: string;
  name: string;
  sets: number;
  repetitions: number;
  suggestedLoadKg: number | null;
};

export type WorkoutPrescription = {
  type: WorkoutType;
  exercises: ExercisePrescription[];
  description: string | null;
};

export type TrainingSheet = {
  id: string;
  corredorId: string;
  createdAt: string;
  workouts: WorkoutPrescription[];
};

export type CoachingLink = {
  id: string;
  personalId: string;
  corredorId: string;
  status: 'pending' | 'active' | 'ended' | 'expired';
  requestedAt: string;
};

export type RunnerSearch = { corredorId: string; email: string; available: boolean };
export type LinkedRunner = { linkId: string; corredorId: string; email: string };

export type ExerciseDraft = { name: string; sets: number; repetitions: number };
export type TrainingSheetDraft = {
  push: ExerciseDraft[];
  pull: ExerciseDraft[];
  lower: ExerciseDraft[];
  runDescription: string;
};

export type StrengthHistoryItem = {
  id: string;
  trainingSheetId: string;
  workoutType: Exclude<WorkoutType, 'run'>;
  date: string;
  createdAt: string;
  exercises: Array<{
    exerciseId: string;
    name: string;
    sets: number;
    repetitions: number;
    loadKg: number | null;
    note: string | null;
    skipped: boolean;
  }>;
};

export type CoachingHistory = {
  strengthExecutions: StrengthHistoryItem[];
  runningSessions: Array<{
    id: string;
    date: string;
    distanceKm: number;
    durationMinutes: number;
    averagePaceMinPerKm: number;
    perceivedEffort: number;
  }>;
};

export type CommandResult<T = undefined> =
  | { status: 'ok'; data: T }
  | { status: 'notFound'; message?: string }
  | { status: 'conflict'; message: string }
  | { status: 'rejected'; message: string }
  | { status: 'unauthenticated' }
  | { status: 'failure' };

export interface CoachingApi {
  account(): Promise<QueryResult<Account>>;
  activeTrainingSheet(): Promise<QueryResult<TrainingSheet>>;
  pendingLinks(): Promise<QueryResult<CoachingLink[]>>;
  activeLink(): Promise<QueryResult<CoachingLink>>;
  linkedRunners(): Promise<QueryResult<LinkedRunner[]>>;
  history(corredorId: string): Promise<QueryResult<CoachingHistory>>;
  searchRunner(email: string): Promise<CommandResult<RunnerSearch>>;
  requestLink(corredorId: string): Promise<CommandResult<CoachingLink>>;
  acceptLink(linkId: string): Promise<CommandResult>;
  endLink(linkId: string): Promise<CommandResult>;
  publishTrainingSheet(
    corredorId: string,
    draft: TrainingSheetDraft,
  ): Promise<CommandResult<TrainingSheet>>;
}
