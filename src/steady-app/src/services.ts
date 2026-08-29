import * as Crypto from 'expo-crypto';
import { HttpQueryApi } from './api/httpQueryApi';
import { HttpRecordApi } from './api/httpRecordApi';
import { HttpCoachingApi } from './api/httpCoachingApi';
import { GoogleSignInSession } from './auth/googleSignInSession';
import { configureGoogleSignIn, nativeGoogleSignInClient } from './auth/nativeGoogleSignInClient';
import { AsyncStorageQueue } from './sync/asyncStorageQueue';
import { RecordQueue } from './sync/recordQueue';
import { SyncEngine } from './sync/syncEngine';
import { AsyncStorageTrainingSheet } from './coaching/asyncStorageTrainingSheet';
import { TrainingSheetCache } from './coaching/trainingSheetCache';
import { AsyncStorageSteadyTrainingPlan } from './planning/asyncStorageSteadyTrainingPlan';
import { SteadyTrainingPlanCache } from './planning/steadyTrainingPlanCache';
import { AsyncStorageCombinedDraft } from './coaching/asyncStorageCombinedDraft';
import { CombinedWorkoutDrafts } from './coaching/combinedWorkoutDraft';

/**
 * Composition root — onde as peças se encontram uma única vez.
 *
 * Todo o resto do app recebe as dependências prontas daqui, o que mantém a
 * lógica de fila e sincronização livre de imports de plataforma (e testável).
 */

/**
 * Base da API.
 *
 * `localhost` no celular aponta para o próprio aparelho, não para a máquina de
 * desenvolvimento — em aparelho real isto precisa ser o IP da máquina na rede
 * local (ex.: `http://192.168.0.10:5050`). A porta 5050 é a que a API usa
 * (`Steady.Api/Properties/launchSettings.json`).
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5050';

/**
 * Client ID do Google, do tipo Web.
 *
 * Precisa ser idêntico ao `Google:ClientId` configurado na API: é a audiência
 * que ela exige no token (ADR-002). Divergiram, todo login vira 401.
 */
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

export const googleSession = new GoogleSignInSession(nativeGoogleSignInClient);

/** Chamado uma vez na inicialização do app. */
export function configureAuth(): void {
  if (GOOGLE_WEB_CLIENT_ID) configureGoogleSignIn(GOOGLE_WEB_CLIENT_ID);
}

/** `true` quando falta configurar o client ID — a tela de login avisa em vez de falhar em silêncio. */
export const isGoogleConfigured = GOOGLE_WEB_CLIENT_ID !== '';

export const recordQueue = new RecordQueue(new AsyncStorageQueue(), () => Crypto.randomUUID());

export const recordApi = new HttpRecordApi(API_BASE_URL, googleSession, fetch as never);

export const syncEngine = new SyncEngine(recordQueue, recordApi);

export const queryApi = new HttpQueryApi(API_BASE_URL, googleSession, fetch as never);

export const coachingApi = new HttpCoachingApi(API_BASE_URL, googleSession, fetch as never);

export const trainingSheetCache = new TrainingSheetCache(
  new AsyncStorageTrainingSheet(),
  coachingApi,
);

export const steadyTrainingPlanCache = new SteadyTrainingPlanCache(
  new AsyncStorageSteadyTrainingPlan(),
  coachingApi,
);

export const combinedWorkoutDrafts = new CombinedWorkoutDrafts(
  new AsyncStorageCombinedDraft(),
  recordQueue,
);
