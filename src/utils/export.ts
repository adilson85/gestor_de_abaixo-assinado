import { Petition, Signature } from '../types';
import { formatPhone } from './validation';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDateTime = (value: Date | string | number): string => {
  const parsedDate = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsedDate);
};

const triggerDownload = (blob: Blob, filename: string): void => {
  const link = document.createElement('a');

  if (link.download === undefined) {
    return;
  }

  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToCSV = (signatures: Signature[], filename: string): void => {
  const headers = ['Nome', 'Telefone', 'Rua', 'Bairro', 'Cidade', 'UF', 'CEP', 'Mensagem Enviada', 'Data de Cadastro'];

  const rows = signatures.map((signature) => [
    signature.name,
    formatPhone(signature.phone),
    signature.street || '',
    signature.neighborhood || '',
    signature.city || '',
    signature.state || '',
    signature.zipCode || '',
    signature.mensagemEnviada ? 'Sim' : 'Não',
    signature.createdAt.toLocaleDateString('pt-BR'),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((field) => `"${field}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filename}.csv`);
};

export const exportPetitionsToJSON = (petitions: Petition[]): void => {
  const payload = JSON.stringify(petitions, null, 2);
  const blob = new Blob([payload], { type: 'application/json;charset=utf-8;' });
  const fileDate = new Date().toISOString().split('T')[0];
  triggerDownload(blob, `petitions-backup-${fileDate}.json`);
};

export const downloadHtmlDocument = (htmlContent: string, filename: string): void => {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  triggerDownload(blob, filename);
};

export const generatePublicSectorPresentationDocument = (
  petition: Petition,
  signatures: Signature[]
): string => {
  const generatedAt = formatDateTime(new Date());
  const escapedPetitionName = escapeHtml(petition.name);
  const escapedDescription = petition.description ? escapeHtml(petition.description) : null;
  const escapedLocation = petition.location ? escapeHtml(petition.location) : null;

  const signatureRows =
    signatures.length > 0
      ? signatures
          .map((signature) => {
            const createdAt = formatDateTime(signature.createdAt);

            return `
          <tr>
              <td>${escapeHtml(signature.name)}</td>
              <td>${escapeHtml(signature.street || '')}</td>
              <td>${escapeHtml(signature.neighborhood || '')}</td>
              <td>${escapeHtml(signature.city || '')}</td>
              <td>${escapeHtml(signature.state || '')}</td>
              <td>${escapeHtml(createdAt)}</td>
          </tr>
        `;
          })
          .join('')
      : `
      <tr>
          <td colspan="6" class="empty-state">Nenhuma assinatura digitalizada disponível para exportação.</td>
      </tr>
    `;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apresentação ao Setor Público - ${escapedPetitionName}</title>
    <style>
        :root {
            color-scheme: light;
        }
        body {
            font-family: Arial, sans-serif;
            margin: 18mm 14mm;
            color: #111827;
            background: #ffffff;
        }
        .header {
            border-bottom: 2px solid #1f2937;
            padding-bottom: 14px;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0 0 8px 0;
            font-size: 24px;
            line-height: 1.25;
        }
        .header p {
            margin: 4px 0;
            font-size: 13px;
            color: #374151;
        }
        .meta-card {
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 12px;
            background: #f9fafb;
            margin-bottom: 18px;
        }
        .meta-card h2 {
            margin: 0 0 8px 0;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #4b5563;
        }
        .meta-card p {
            margin: 0;
            font-size: 14px;
            line-height: 1.5;
        }
        .table-wrap {
            margin-top: 16px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        thead {
            display: table-header-group;
        }
        tr {
            page-break-inside: avoid;
        }
        th, td {
            border: 1px solid #d1d5db;
            padding: 8px 7px;
            text-align: left;
            vertical-align: top;
            word-break: break-word;
        }
        th {
            font-size: 11px;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            background: #f3f4f6;
        }
        td {
            font-size: 11px;
            line-height: 1.4;
        }
        .empty-state {
            text-align: center;
            padding: 16px;
            color: #6b7280;
        }
        .footer {
            margin-top: 16px;
            padding-top: 10px;
            border-top: 1px solid #d1d5db;
            font-size: 11px;
            color: #4b5563;
            display: flex;
            justify-content: space-between;
            gap: 12px;
        }
        @page {
            size: A4;
            margin: 14mm;
        }
        @media print {
            body {
                margin: 0;
            }
            .meta-card {
                break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <h1>${escapedPetitionName}</h1>
        <p>Relação de assinaturas digitalizadas para apresentação institucional</p>
        <p>Gerado em: ${escapeHtml(generatedAt)}</p>
    </header>

    <section class="meta-card">
        <h2>Contexto da petição</h2>
        <p><strong>Nome:</strong> ${escapedPetitionName}</p>
        ${escapedDescription ? `<p><strong>Descrição:</strong> ${escapedDescription}</p>` : ''}
        ${escapedLocation ? `<p><strong>Local ou abrangência:</strong> ${escapedLocation}</p>` : ''}
    </section>

    <section class="table-wrap">
        <table>
            <thead>
                <tr>
                    <th>NOME COMPLETO</th>
                    <th>RUA</th>
                    <th>BAIRRO</th>
                    <th>CIDADE</th>
                    <th>UF</th>
                    <th>DATA E HORÁRIO DA ASSINATURA</th>
                </tr>
            </thead>
            <tbody>
                ${signatureRows}
            </tbody>
        </table>
    </section>

    <footer class="footer">
        <span>Documento gerado pela plataforma AssinaPovo.</span>
        <span>Emissão: ${escapeHtml(generatedAt)}</span>
    </footer>
</body>
</html>
  `.trim();
};
