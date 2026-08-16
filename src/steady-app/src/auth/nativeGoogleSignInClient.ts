import { GoogleSignin } from '@react-native-google-signin/google-signin';
import type { GoogleSignInClient } from './googleSignInSession';

/**
 * Adaptador para `@react-native-google-signin/google-signin`.
 *
 * Traduz o `{ type: 'success' | 'cancelled' | 'noSavedCredentialFound' }` da
 * biblioteca para o booleano da porta. Este arquivo é o único que toca o módulo
 * nativo — por isso não é coberto por teste: ele só existe de verdade num
 * development build.
 */
export const nativeGoogleSignInClient: GoogleSignInClient = {
  async signIn() {
    const response = await GoogleSignin.signIn();
    return response.type === 'success';
  },

  async signInSilently() {
    const response = await GoogleSignin.signInSilently();
    return response.type === 'success';
  },

  async getTokens() {
    const { idToken } = await GoogleSignin.getTokens();
    return { idToken };
  },

  // Síncrono na biblioteca; a porta é assíncrona porque as outras são.
  async currentUser() {
    const current = GoogleSignin.getCurrentUser();
    return current ? { email: current.user.email } : null;
  },

  async signOut() {
    await GoogleSignin.signOut();
  },
};

/**
 * Configura a biblioteca. Precisa rodar uma vez antes de qualquer login.
 *
 * O `webClientId` é obrigatório mesmo em app mobile: é ele que faz o Google
 * emitir o `idToken`, e ele precisa ser o mesmo client ID que a API valida como
 * audiência (ADR-002) — se divergirem, todo login é rejeitado com 401.
 */
export function configureGoogleSignIn(webClientId: string): void {
  GoogleSignin.configure({ webClientId });
}
