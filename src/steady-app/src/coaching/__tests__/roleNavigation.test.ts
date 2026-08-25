import { hasPersonalArea } from '../roleNavigation';

describe('navegação por roles', () => {
  it('mostra a área do personal quando a conta tem as duas roles', () => {
    expect(hasPersonalArea(['Corredor', 'Personal'])).toBe(true);
  });

  it('não mostra a área do personal para uma conta apenas corredor', () => {
    expect(hasPersonalArea(['Corredor'])).toBe(false);
  });
});
