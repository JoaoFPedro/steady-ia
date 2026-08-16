import NetInfo from '@react-native-community/netinfo';
import type { Connectivity } from './connectivity';

/**
 * Conectividade real do aparelho.
 *
 * `isInternetReachable` importa tanto quanto `isConnected`: o Wi-Fi do prédio
 * pode estar conectado e sem saída para a internet, e tentar sincronizar ali só
 * gastaria bateria. Quando ele ainda é `null` (o NetInfo não terminou de
 * verificar) tentamos mesmo assim — uma tentativa que falha é barata, o item
 * permanece na fila e a reconexão seguinte tenta de novo.
 */
export const netInfoConnectivity: Connectivity = {
  subscribe(listener) {
    return NetInfo.addEventListener((state) => {
      listener(state.isConnected === true && state.isInternetReachable !== false);
    });
  },
};
