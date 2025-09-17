import { ValidationError } from '../types';

export const validateName = (name: string): string | null => {
  if (!name || name.trim().length < 3) {
    return 'Nome deve ter pelo menos 3 caracteres';
  }
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!phone) return 'Telefone é obrigatório';
  
  // Remove all non-numeric characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // WhatsApp validation: must be 11 digits (DDD + 9 + 8 digits)
  if (cleanPhone.length !== 11) {
    return 'Telefone deve ter 11 dígitos (DDD + número com 9)';
  }
  
  // Check if it starts with valid DDD (11-99)
  const ddd = cleanPhone.substring(0, 2);
  const dddNumber = parseInt(ddd);
  if (dddNumber < 11 || dddNumber > 99) {
    return 'DDD inválido (deve ser entre 11 e 99)';
  }
  
  // Check if the third digit is 9 (required for WhatsApp)
  if (cleanPhone.charAt(2) !== '9') {
    return 'Número deve começar com 9 após o DDD (formato WhatsApp)';
  }
  
  // Check if remaining digits are valid
  const remainingDigits = cleanPhone.substring(3);
  if (remainingDigits.length !== 8) {
    return 'Número deve ter 8 dígitos após o DDD e o 9';
  }
  
  return null;
};

export const validateState = (state: string): string | null => {
  if (!state) return null;
  if (!/^[A-Z]{2}$/.test(state.toUpperCase())) {
    return 'UF deve ter 2 letras maiúsculas';
  }
  return null;
};

export const validateZipCode = (zipCode: string): string | null => {
  if (!zipCode) return null;
  const cleanZipCode = zipCode.replace(/\D/g, '');
  if (cleanZipCode.length !== 8) {
    return 'CEP deve ter 8 dígitos';
  }
  return null;
};

export const normalizePhone = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

export const formatPhone = (phone: string): string => {
  const clean = normalizePhone(phone);
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return phone;
};

export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
};