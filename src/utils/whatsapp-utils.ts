/**
 * Utilitários para formatação de números de WhatsApp
 */

const dddsValidos = [
  '11', '12', '13', '14', '15', '16', '17', '18', '19',
  '21', '22', '24', '27', '28', '31', '32', '33', '34',
  '35', '37', '38', '41', '42', '43', '44', '45', '46',
  '47', '48', '49', '51', '53', '54', '55',
  '61', '62', '63', '64', '65', '66', '67', '68', '69',
  '71', '73', '74', '75', '77', '79',
  '81', '82', '83', '84', '85', '86', '87', '88', '89',
  '91', '92', '93', '94', '95', '96', '97', '98', '99',
];

export const cleanPhone = (phone: string): string => phone.replace(/\D/g, '');

export const validateDDD = (ddd: string): boolean => /^\d{2}$/.test(ddd) && dddsValidos.includes(ddd);

/**
 * Formata um número de telefone para o formato do BotConversa
 * @param phone Número de telefone no formato brasileiro
 * @returns Número formatado para o BotConversa (+55XXXXXXXXXXX) ou null quando inválido
 */
export const formatPhoneForBotConversa = (phone: string): string | null => {
  let normalizedPhone = cleanPhone(phone);

  if (normalizedPhone.startsWith('55')) {
    normalizedPhone = normalizedPhone.substring(2);
  }

  if (normalizedPhone.length < 10 || normalizedPhone.length > 11) {
    return null;
  }

  const ddd = normalizedPhone.substring(0, 2);
  let whatsappNumber = normalizedPhone.substring(2);

  if (!validateDDD(ddd)) {
    return null;
  }

  if (whatsappNumber.length === 8) {
    whatsappNumber = `9${whatsappNumber}`;
  } else if (whatsappNumber.length !== 9 || !whatsappNumber.startsWith('9')) {
    return null;
  }

  return `+55${ddd}${whatsappNumber}`;
};

/**
 * Gera a URL do BotConversa para um número de telefone
 */
export const generateBotConversaUrl = (phone: string): string | null => {
  const formattedPhone = formatPhoneForBotConversa(phone);

  if (!formattedPhone) {
    return null;
  }

  return `https://app.botconversa.com.br/68827/live-chat/all/${formattedPhone}`;
};

/**
 * Valida se um número de telefone é válido para WhatsApp
 */
export const isValidWhatsAppNumber = (phone: string): boolean => !!formatPhoneForBotConversa(phone);
