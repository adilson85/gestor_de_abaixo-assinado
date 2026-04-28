import { clearFormDraft, getFormDraft, hasFormDraft, setFormDraft } from '../form-drafts';

describe('form draft store', () => {
  afterEach(() => {
    clearFormDraft('test:draft');
  });

  it('keeps draft data while navigating within the app session', () => {
    setFormDraft('test:draft', {
      name: 'Campanha em andamento',
      description: 'Texto ainda nao salvo',
    });

    expect(hasFormDraft('test:draft')).toBe(true);
    expect(getFormDraft<{ name: string; description: string }>('test:draft')).toEqual({
      name: 'Campanha em andamento',
      description: 'Texto ainda nao salvo',
    });
  });

  it('clears a draft after the flow finishes', () => {
    setFormDraft('test:draft', { name: 'Rascunho' });

    clearFormDraft('test:draft');

    expect(hasFormDraft('test:draft')).toBe(false);
    expect(getFormDraft('test:draft')).toBeNull();
  });
});
