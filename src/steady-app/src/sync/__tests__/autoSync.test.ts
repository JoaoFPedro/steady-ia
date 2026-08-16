import { startAutoSync } from '../autoSync';
import type { Connectivity } from '../connectivity';

/**
 * Cenário da spec: "Fila sincroniza sozinha quando a conexão volta".
 *
 * Sem isto, um treino registrado sem sinal só sairia da fila no próximo
 * registro — e a avaliação de sobrecarga ficaria desatualizada exatamente na
 * semana em que o corredor mais precisa dela.
 */

function fakeConnectivity() {
  const listeners: ((online: boolean) => void)[] = [];

  const connectivity: Connectivity = {
    subscribe(listener) {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index >= 0) listeners.splice(index, 1);
      };
    },
  };

  return {
    connectivity,
    report(online: boolean) {
      listeners.forEach((listener) => listener(online));
    },
    get subscriberCount() {
      return listeners.length;
    },
  };
}

function fakeSyncEngine() {
  const engine = {
    calls: 0,
    async sync() {
      engine.calls += 1;
      return { synced: 0, deferred: 0, rejected: [], unauthenticated: false };
    },
  };

  return engine;
}

describe('sincronização automática na volta da conexão', () => {
  it('sincroniza quando a conexão volta', async () => {
    const net = fakeConnectivity();
    const engine = fakeSyncEngine();
    startAutoSync(net.connectivity, engine);

    net.report(false);
    net.report(true);
    await Promise.resolve();

    expect(engine.calls).toBe(1);
  });

  it('sincroniza na primeira vez que se descobre online, pelos pendentes da sessão anterior', async () => {
    const net = fakeConnectivity();
    const engine = fakeSyncEngine();
    startAutoSync(net.connectivity, engine);

    net.report(true);
    await Promise.resolve();

    expect(engine.calls).toBe(1);
  });

  it('não sincroniza de novo a cada aviso de que continua online', async () => {
    const net = fakeConnectivity();
    const engine = fakeSyncEngine();
    startAutoSync(net.connectivity, engine);

    net.report(true);
    net.report(true);
    net.report(true);
    await Promise.resolve();

    expect(engine.calls).toBe(1);
  });

  it('não tenta sincronizar quando a conexão cai', async () => {
    const net = fakeConnectivity();
    const engine = fakeSyncEngine();
    startAutoSync(net.connectivity, engine);

    net.report(false);
    await Promise.resolve();

    expect(engine.calls).toBe(0);
  });

  it('volta a sincronizar a cada nova reconexão', async () => {
    const net = fakeConnectivity();
    const engine = fakeSyncEngine();
    startAutoSync(net.connectivity, engine);

    net.report(true);
    net.report(false);
    net.report(true);
    await Promise.resolve();

    expect(engine.calls).toBe(2);
  });

  it('para de observar quando é cancelado', () => {
    const net = fakeConnectivity();
    const stop = startAutoSync(net.connectivity, fakeSyncEngine());

    stop();

    expect(net.subscriberCount).toBe(0);
  });

  it('uma falha de sincronização não derruba o observador', async () => {
    const net = fakeConnectivity();
    let calls = 0;
    const engine = {
      async sync() {
        calls += 1;
        throw new Error('servidor indisponível');
      },
    };
    startAutoSync(net.connectivity, engine);

    net.report(true);
    net.report(false);
    net.report(true);
    await Promise.resolve();

    expect(calls).toBe(2);
  });
});
