import {
  formatPhoneForBotConversa,
  generateBotConversaUrl,
  validateDDD,
  cleanPhone
} from '../whatsapp-utils';

describe('WhatsApp Utils', () => {
  describe('cleanPhone', () => {
    it('should remove all non-numeric characters', () => {
      expect(cleanPhone('(11) 98765-4321')).toBe('11987654321');
      expect(cleanPhone('+55 11 98765-4321')).toBe('5511987654321');
      expect(cleanPhone('11 9 8765-4321')).toBe('11987654321');
    });
  });

  describe('validateDDD', () => {
    it('should return true for valid DDDs', () => {
      expect(validateDDD('11')).toBe(true);
      expect(validateDDD('21')).toBe(true);
      expect(validateDDD('47')).toBe(true);
      expect(validateDDD('99')).toBe(true);
    });

    it('should return false for invalid DDDs', () => {
      expect(validateDDD('10')).toBe(false);
      expect(validateDDD('00')).toBe(false);
      expect(validateDDD('100')).toBe(false);
    });
  });

  describe('formatPhoneForBotConversa', () => {
    it('should format valid phone numbers correctly', () => {
      // Phone with 11 digits (DDD + 9 + 8 digits)
      expect(formatPhoneForBotConversa('11987654321')).toBe('+5511987654321');
      expect(formatPhoneForBotConversa('(11) 98765-4321')).toBe('+5511987654321');
      expect(formatPhoneForBotConversa('+55 11 98765-4321')).toBe('+5511987654321');
    });

    it('should return null for invalid phone numbers', () => {
      expect(formatPhoneForBotConversa('123456789')).toBeNull(); // Too short
      expect(formatPhoneForBotConversa('10987654321')).toBeNull(); // Invalid DDD
      expect(formatPhoneForBotConversa('11887654321')).toBeNull(); // Missing 9 after DDD
    });
  });

  describe('generateBotConversaUrl', () => {
    it('should generate correct BotConversa URLs', () => {
      const url = generateBotConversaUrl('11987654321');
      expect(url).toBe('https://app.botconversa.com.br/68827/live-chat/all/+5511987654321');
    });

    it('should return null for invalid phone numbers', () => {
      expect(generateBotConversaUrl('invalid')).toBeNull();
      expect(generateBotConversaUrl('123456')).toBeNull();
    });
  });
});
