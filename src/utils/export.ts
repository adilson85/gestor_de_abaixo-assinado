import { Signature } from '../types';
import { formatPhone } from './validation';

export const exportToCSV = (signatures: Signature[], filename: string): void => {
  const headers = ['Nome', 'Telefone', 'Rua', 'Bairro', 'Cidade', 'UF', 'CEP', 'Mensagem Enviada', 'Data de Cadastro'];
  
  const rows = signatures.map(signature => [
    signature.name,
    formatPhone(signature.phone),
    signature.street || '',
    signature.neighborhood || '',
    signature.city || '',
    signature.state || '',
    signature.zipCode || '',
    signature.mensagemEnviada ? 'Sim' : 'Não',
    signature.createdAt.toLocaleDateString('pt-BR')
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};