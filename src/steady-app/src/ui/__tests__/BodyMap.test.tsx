import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { BodyMap } from '../BodyMap';
import { color } from '../../theme/nocturne';

const mockBody = jest.fn((_props: unknown) => null);
jest.mock('react-native-body-highlighter', () => ({
  __esModule: true,
  default: (props: unknown) => mockBody(props),
}));

/** Cenários "mapa muscular" e "visual" da spec (specs/STORY-025). */
async function render(element: React.ReactElement) {
  let renderer: TestRenderer.ReactTestRenderer;
  await act(async () => { renderer = TestRenderer.create(element); });
  return renderer!;
}

describe('mapa corporal — STORY-025', () => {
  beforeEach(() => mockBody.mockClear());

  it('mostra as vistas frontal e traseira com as partes destacadas', async () => {
    await render(<BodyMap regions={['peitoral', 'triceps']} />);

    const sides = mockBody.mock.calls.map(([props]) => (props as { side: string }).side);
    expect(sides).toEqual(['front', 'back']);
    for (const [props] of mockBody.mock.calls) {
      expect((props as { data: { slug: string }[] }).data.map((part) => part.slug)).toEqual(['chest', 'triceps']);
    }
  });

  it('pinta com o accent do Nocturne e deixa o resto em tom neutro do tema', async () => {
    await render(<BodyMap regions={['ombro']} />);

    const props = mockBody.mock.calls[0][0] as { colors: string[]; defaultFill: string; border: string };
    expect(props.colors).toEqual([color.accent]);
    expect(Object.values(color.neutral)).toContain(props.defaultFill);
    expect(props.border).toBe('none');
  });

  it('anuncia os músculos em texto para o leitor de tela', async () => {
    const renderer = await render(<BodyMap regions={['biceps', 'dorsal']} />);

    const labelled = renderer.root.findAll((node) => node.props.accessibilityLabel !== undefined);
    expect(labelled[0].props.accessibilityLabel).toBe('Músculos trabalhados: Bíceps, Dorsal');
  });

  it('sem regiões o corpo aparece neutro e o texto diz que não há destaque', async () => {
    const renderer = await render(<BodyMap regions={[]} />);

    expect(mockBody).toHaveBeenCalledTimes(2);
    expect((mockBody.mock.calls[0][0] as { data: unknown[] }).data).toEqual([]);
    const labelled = renderer.root.findAll((node) => node.props.accessibilityLabel !== undefined);
    expect(labelled[0].props.accessibilityLabel).toBe('Nenhum músculo destacado');
  });
});
