export interface CEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export const fetchAddressByCEP = async (cep: string): Promise<CEPResponse | null> => {
  // Remove non-numeric characters
  const cleanCEP = cep.replace(/\D/g, '');
  
  // Validate CEP format (8 digits)
  if (cleanCEP.length !== 8) {
    return null;
  }
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    
    if (!response.ok) {
      return null;
    }
    
    const data: CEPResponse = await response.json();
    
    // Check if CEP was found
    if (data.erro) {
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
};

export const formatCEP = (cep: string): string => {
  const clean = cep.replace(/\D/g, '');
  if (clean.length === 8) {
    return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  return cep;
};