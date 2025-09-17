import {
  validateName,
  validatePhone,
  validateState,
  validateZipCode,
  normalizePhone,
  formatPhone,
  generateSlug,
} from '../validation';

describe('Validation Utils', () => {
  describe('validateName', () => {
    it('should return null for valid names', () => {
      expect(validateName('João Silva')).toBeNull();
      expect(validateName('Maria José')).toBeNull();
      expect(validateName('Ana')).toBeNull();
    });

    it('should return error for invalid names', () => {
      expect(validateName('')).toBe('Nome deve ter pelo menos 3 caracteres');
      expect(validateName('Jo')).toBe('Nome deve ter pelo menos 3 caracteres');
      expect(validateName('   ')).toBe('Nome deve ter pelo menos 3 caracteres');
    });
  });

  describe('validatePhone', () => {
    it('should return null for valid phones', () => {
      expect(validatePhone('11987654321')).toBeNull();
      expect(validatePhone('(11) 98765-4321')).toBeNull();
      expect(validatePhone('11 98765 4321')).toBeNull();
    });

    it('should return error for invalid phones', () => {
      expect(validatePhone('')).toBe('Telefone é obrigatório');
      expect(validatePhone('123456789')).toBe('Telefone deve ter 11 dígitos (DDD + número com 9)');
      expect(validatePhone('1198765432')).toBe('Telefone deve ter 11 dígitos (DDD + número com 9)');
      expect(validatePhone('10987654321')).toBe('DDD inválido (deve ser entre 11 e 99)');
      expect(validatePhone('05987654321')).toBe('DDD inválido (deve ser entre 11 e 99)');
    });
  });

  describe('validateState', () => {
    it('should return null for valid states', () => {
      expect(validateState('SP')).toBeNull();
      expect(validateState('RJ')).toBeNull();
      expect(validateState('')).toBeNull();
    });

    it('should return error for invalid states', () => {
      expect(validateState('S')).toBe('UF deve ter 2 letras maiúsculas');
      expect(validateState('SPA')).toBe('UF deve ter 2 letras maiúsculas');
    });
  });

  describe('validateZipCode', () => {
    it('should return null for valid zip codes', () => {
      expect(validateZipCode('01234567')).toBeNull();
      expect(validateZipCode('01234-567')).toBeNull();
      expect(validateZipCode('')).toBeNull();
    });

    it('should return error for invalid zip codes', () => {
      expect(validateZipCode('1234567')).toBe('CEP deve ter 8 dígitos');
      expect(validateZipCode('123456789')).toBe('CEP deve ter 8 dígitos');
    });
  });

  describe('normalizePhone', () => {
    it('should remove all non-numeric characters', () => {
      expect(normalizePhone('(11) 98765-4321')).toBe('11987654321');
      expect(normalizePhone('11 98765 4321')).toBe('11987654321');
      expect(normalizePhone('+55 11 98765-4321')).toBe('5511987654321');
    });
  });

  describe('formatPhone', () => {
    it('should format phone numbers correctly', () => {
      expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
      expect(formatPhone('(11) 98765-4321')).toBe('(11) 98765-4321');
    });
  });

  describe('generateSlug', () => {
    it('should generate valid slugs', () => {
      expect(generateSlug('Abaixo-Assinado Teste')).toBe('abaixoassinado-teste');
      expect(generateSlug('Petição com Acentos')).toBe('peticao-com-acentos');
      expect(generateSlug('Teste@#$%^&*()')).toBe('teste');
    });
  });
});
