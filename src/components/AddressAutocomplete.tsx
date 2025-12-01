import React, { useCallback, useEffect, useRef, useState } from 'react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onAddressSelect: (address: {
    street: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  }) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = React.memo(({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Digite o endereço...",
  className = "",
  disabled = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyAvailable, setApiKeyAvailable] = useState<boolean | null>(null);

  // Memoizar o callback para evitar re-renderizações
  const handleAddressSelect = useCallback((address: {
    street: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  }) => {
    onAddressSelect(address);
  }, [onAddressSelect]);

  useEffect(() => {
    // Verificar se a API key está disponível
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'undefined' || apiKey === '') {
      setApiKeyAvailable(false);
      setError('Google Maps API key não configurada. Use a busca por CEP como alternativa.');
      return;
    }
    setApiKeyAvailable(true);

    const initializeGooglePlaces = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Importação dinâmica para evitar que a chave seja incluída no build
        const { Loader } = await import('@googlemaps/js-api-loader');
        
        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
          libraries: ['places']
        });

        await loader.load();

        if (inputRef.current && !autocompleteRef.current) {
          autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
            types: ['address'],
            componentRestrictions: { country: 'br' }
          });

          autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current?.getPlace();
            if (place && place.address_components) {
              const addressComponents = place.address_components;
              
              // Extrair componentes do endereço
              let street = '';
              let streetNumber = '';
              let neighborhood = '';
              let city = '';
              let state = '';
              let zipCode = '';

              addressComponents.forEach(component => {
                const types = component.types;
                
                if (types.includes('route')) {
                  street = component.long_name;
                }
                if (types.includes('street_number')) {
                  streetNumber = component.long_name;
                }
                if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
                  neighborhood = component.long_name;
                }
                if (types.includes('administrative_area_level_2')) {
                  city = component.long_name;
                }
                if (types.includes('administrative_area_level_1')) {
                  state = component.short_name;
                }
                if (types.includes('postal_code')) {
                  zipCode = component.long_name;
                }
              });

              // Se não encontrou bairro, tentar usar sublocality_level_2
              if (!neighborhood) {
                const sublocality2 = addressComponents.find(comp => 
                  comp.types.includes('sublocality_level_2')
                );
                if (sublocality2) {
                  neighborhood = sublocality2.long_name;
                }
              }

              console.log('Endereço extraído:', {
                street,
                streetNumber,
                neighborhood,
                city,
                state,
                zipCode
              });

              console.log('Componentes do endereço:', addressComponents);

              // Chamar callback com os dados extraídos
              handleAddressSelect({
                street: streetNumber ? `${street}, ${streetNumber}` : street,
                neighborhood,
                city,
                state,
                zipCode
              });
            }
          });
        }
      } catch (err) {
        console.error('Erro ao carregar Google Maps:', err);
        setError('Erro ao carregar Google Maps. Use a busca por CEP como alternativa.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeGooglePlaces();

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [handleAddressSelect]);

  // Se a API key não estiver disponível, renderizar um input simples
  if (apiKeyAvailable === false) {
    return (
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Digite o endereço manualmente..."
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 border-gray-300 dark:border-gray-600 ${className}`}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Google Maps não configurado. Digite o endereço manualmente.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
          error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
        } ${isLoading ? 'pr-10' : ''} ${className}`}
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
      )}
      
      {!error && !isLoading && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Digite o endereço para ver sugestões automáticas
        </p>
      )}
    </div>
  );
});