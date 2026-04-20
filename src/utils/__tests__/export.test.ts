import {
  downloadHtmlDocument,
  exportPetitionsToJSON,
  exportToCSV,
  generatePublicSectorPresentationDocument
} from '../export';
import { Petition, Signature } from '../../types';

// Mock global functions
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('Export Utils', () => {
  let mockLink: HTMLAnchorElement;

  beforeEach(() => {
    // Mock document.createElement
    mockLink = {
      href: '',
      download: '',
      click: jest.fn(),
      setAttribute: jest.fn((key: string, value: string) => {
        Object.assign(mockLink, { [key]: value });
      }),
      style: { display: '', visibility: '' }
    } as unknown as HTMLAnchorElement;

    jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('exportToCSV', () => {
    it('should export signatures to CSV format', () => {
      const signatures: Signature[] = [
        {
          id: '1',
          name: 'João Silva',
          phone: '11987654321',
          street: 'Rua A',
          neighborhood: 'Bairro B',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234567',
          mensagemEnviada: false,
          createdAt: new Date('2024-01-01')
        },
        {
          id: '2',
          name: 'Maria Santos',
          phone: '21987654321',
          city: 'Rio de Janeiro',
          state: 'RJ',
          createdAt: new Date('2024-01-02')
        } as Signature
      ];

      exportToCSV(signatures, 'test-petition');

      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.download).toBe('test-petition.csv');
    });

    it('should handle empty signatures array', () => {
      exportToCSV([], 'empty-petition');
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('exportPetitionsToJSON', () => {
    it('should export petitions to JSON format', () => {
      const petitions: Petition[] = [
        {
          id: '1',
          slug: 'petition-1',
          name: 'Petition 1',
          tableName: 'signatures_1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        }
      ];

      exportPetitionsToJSON(petitions);

      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.download).toMatch(/petitions-backup-.*\.json/);
    });

    it('should handle empty petitions array', () => {
      exportPetitionsToJSON([]);
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('downloadHtmlDocument', () => {
    it('should download an HTML document with the provided filename', () => {
      downloadHtmlDocument('<html><body>teste</body></html>', 'documento.html');

      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.download).toBe('documento.html');
    });
  });

  describe('generatePublicSectorPresentationDocument', () => {
    it('should generate a printable document without phone numbers', () => {
      const petition: Petition = {
        id: 'petition-1',
        slug: 'peticao-publica',
        name: 'Praça Viva',
        description: 'Solicitação de melhorias urbanas',
        location: 'Joinville',
        tableName: 'signatures_peticao_publica',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z')
      };

      const signatures: Signature[] = [
        {
          id: '1',
          name: 'Ana Souza',
          phone: '47999999999',
          street: 'Rua das Flores',
          neighborhood: 'Centro',
          city: 'Joinville',
          state: 'SC',
          zipCode: '89201-000',
          createdAt: new Date('2024-03-10T14:35:00.000Z')
        }
      ];

      const html = generatePublicSectorPresentationDocument(petition, signatures);

      expect(html).toContain('Documento gerado pela plataforma AssinaPovo.');
      expect(html).toContain('Relação de assinaturas digitalizadas para apresentação institucional');
      expect(html).toContain('Ana Souza');
      expect(html).toContain('Rua das Flores');
      expect(html).toContain('Centro');
      expect(html).toContain('Joinville');
      expect(html).toContain('SC');
      expect(html).toMatch(/10\/03\/2024, \d{2}:\d{2}/);
      expect(html).not.toContain('47999999999');
      expect(html).not.toContain('TELEFONE');
      expect(html).not.toContain('CEP');
      expect(html).not.toContain('Resumo do documento');
    });
  });
});
