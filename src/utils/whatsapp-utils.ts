/**
 * Utilitários para formatação de números de WhatsApp
 */

// Lista de DDDs que requerem o nono dígito
const dddsComNonoDigito = [
  '11', '12', '13', '14', '15', '16', '17', '18', '19',
  '21', '22', '24', '27', '28', '31', '32', '33', '34',
  '35', '37', '38', '61', '62', '63', '64', '65', '66',
  '67', '68', '69', '71', '73', '74', '75', '77', '79',
  '81', '82', '83', '84', '85', '86', '87', '88', '89',
  '91', '92', '93', '94', '95', '96', '97', '98', '99'
];

/**
 * Formata um número de telefone para o formato do BotConversa
 * @param phone - Número de telefone no formato brasileiro
 * @returns Número formatado para o BotConversa (+55XXXXXXXXXXX)
 */
export const formatPhoneForBotConversa = (phone: string): string => {
  // Remove todos os caracteres não numéricos
  let cleanPhone = phone.replace(/\D/g, '');
  
  // Se já tem o código do país (55), remove
  if (cleanPhone.startsWith('55')) {
    cleanPhone = cleanPhone.substring(2);
  }
  
  // Se tem menos de 10 dígitos, não é um número válido
  if (cleanPhone.length < 10) {
    return '';
  }
  
  // Extrai o DDD (primeiros 2 dígitos)
  const ddd = cleanPhone.substring(0, 2);
  let whatsapp = cleanPhone.substring(2);
  
  // Aplica as regras do nono dígito
  if (dddsComNonoDigito.includes(ddd) && whatsapp.length === 8) {
    // Adiciona o nono dígito para DDDs que requerem
    whatsapp = '9' + whatsapp;
  } else if (!dddsComNonoDigito.includes(ddd) && whatsapp.length === 9 && whatsapp.startsWith('9')) {
    // Remove o nono dígito para DDDs que NÃO requerem (se o número vier com 9 à frente)
    whatsapp = whatsapp.substring(1);
  }
  
  // Retorna no formato +55XXXXXXXXXXX
  return `+55${ddd}${whatsapp}`;
};

/**
 * Gera a URL do BotConversa para um número de telefone
 * @param phone - Número de telefone
 * @returns URL do BotConversa
 */
export const generateBotConversaUrl = (phone: string): string => {
  const formattedPhone = formatPhoneForBotConversa(phone);
  if (!formattedPhone) {
    return '';
  }
  
  return `https://app.botconversa.com.br/68827/live-chat/all/${formattedPhone}`;
};

/**
 * Valida se um número de telefone é válido para WhatsApp
 * @param phone - Número de telefone
 * @returns true se válido, false caso contrário
 */
export const isValidWhatsAppNumber = (phone: string): boolean => {
  const formattedPhone = formatPhoneForBotConversa(phone);
  // Aceita +55 + DDD (2) + número com 8 ou 9 dígitos (13 ou 14 chars)
  return formattedPhone.length === 14 || formattedPhone.length === 13;
};
