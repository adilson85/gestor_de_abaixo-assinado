import { Petition, Signature } from '../types';

const PETITIONS_KEY = 'petitions';
const SIGNATURES_KEY = 'signatures';

export const getPetitions = (): Petition[] => {
  const stored = localStorage.getItem(PETITIONS_KEY);
  if (!stored) return [];
  
  return JSON.parse(stored).map((p: any) => ({
    ...p,
    createdAt: new Date(p.createdAt),
    updatedAt: new Date(p.updatedAt),
  }));
};

export const savePetition = (petition: Petition): void => {
  const petitions = getPetitions();
  const existingIndex = petitions.findIndex(p => p.id === petition.id);
  
  if (existingIndex >= 0) {
    petitions[existingIndex] = petition;
  } else {
    petitions.push(petition);
  }
  
  localStorage.setItem(PETITIONS_KEY, JSON.stringify(petitions));
};

export const deletePetition = (id: string): void => {
  const petitions = getPetitions().filter(p => p.id !== id);
  localStorage.setItem(PETITIONS_KEY, JSON.stringify(petitions));
  
  // Also remove signatures for this petition
  const signatures = getSignatures().filter(s => s.petitionId !== id);
  localStorage.setItem(SIGNATURES_KEY, JSON.stringify(signatures));
};

export const getSignatures = (): Signature[] => {
  const stored = localStorage.getItem(SIGNATURES_KEY);
  if (!stored) return [];
  
  return JSON.parse(stored).map((s: any) => ({
    ...s,
    createdAt: new Date(s.createdAt),
  }));
};

export const getSignaturesByPetition = (petitionId: string): Signature[] => {
  return getSignatures().filter(s => s.petitionId === petitionId);
};

export const saveSignature = (signature: Signature): void => {
  const signatures = getSignatures();
  signatures.push(signature);
  localStorage.setItem(SIGNATURES_KEY, JSON.stringify(signatures));
};

export const checkPhoneDuplicate = (petitionId: string, phone: string, excludeId?: string): boolean => {
  const signatures = getSignaturesByPetition(petitionId);
  const normalizedPhone = phone.replace(/\D/g, '');
  
  return signatures.some(s => 
    s.phone === normalizedPhone && s.id !== excludeId
  );
};