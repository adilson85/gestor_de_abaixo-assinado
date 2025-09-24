import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

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

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
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

  useEffect(() => {
    // Verificar se a API key está disponível
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setApiKeyAvailable(false);
      setError('Google Maps API key não configurada. Use a busca por CEP como alternativa.');
      return;
    }
    setApiKeyAvailable(true);

    const initializeGooglePlaces = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
          libraries: ['places']
        });

        await loader.load();

        if (inputRef.current && !autocompleteRef.current) {
          autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
            types: ['address'],
            componentRestrictions: { country: 'br' }, // Restringir ao Brasil
            fields: ['address_components', 'formatted_address', 'geometry']
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
                } else if (types.includes('street_number')) {
                  streetNumber = component.long_name;
                } else if (types.includes('sublocality') || types.includes('sublocality_level_1') || types.includes('neighborhood')) {
                  neighborhood = component.long_name;
                } else if (types.includes('administrative_area_level_2') || types.includes('locality')) {
                  city = component.long_name;
                } else if (types.includes('administrative_area_level_1')) {
                  state = component.short_name;
                } else if (types.includes('postal_code')) {
                  zipCode = component.long_name;
                }
              });

              // Fallback para bairro se não encontrado
              if (!neighborhood) {
                const sublocality = addressComponents.find(comp => 
                  comp.types.includes('sublocality') || comp.types.includes('sublocality_level_1')
                );
                if (sublocality) {
                  neighborhood = sublocality.long_name;
                }
              }

              // Combinar rua e número
              const fullStreet = streetNumber ? `${street}, ${streetNumber}` : street;

              const addressData = {
                street: fullStreet,
                neighborhood,
                city,
                state,
                zipCode
              };

              console.log('Dados extraídos do Google Places:', addressData);
              console.log('Componentes do endereço:', addressComponents);

              // Chamar callback com os dados do endereço
              onAddressSelect(addressData);

              // Atualizar o valor do input
              onChange(place.formatted_address || '');
            }
          });
        }
      } catch (err) {
        console.error('Erro ao carregar Google Places API:', err);
        setError('Erro ao carregar autocomplete de endereços');
      } finally {
        setIsLoading(false);
      }
    };

    initializeGooglePlaces();

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [onChange, onAddressSelect]);

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
};
