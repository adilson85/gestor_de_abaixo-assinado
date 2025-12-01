import { exportToCSV, exportPetitionsToJSON } from '../export';
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
      style: { display: '' }
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
});
