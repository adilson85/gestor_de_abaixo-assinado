# 🗺️ Configuração do Google Maps API

Este documento explica como configurar a API do Google Maps para usar o autocomplete de endereços no sistema.

## 📋 Pré-requisitos

1. Conta no Google Cloud Platform
2. Projeto ativo no Google Cloud
3. Billing habilitado (necessário para usar as APIs)

## 🔧 Configuração

### 1. Habilitar APIs Necessárias

No Google Cloud Console, habilite as seguintes APIs:

- **Places API** (para autocomplete de endereços)
- **Maps JavaScript API** (para carregar a biblioteca)

### 2. Criar Chave de API

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Vá para "APIs & Services" > "Credentials"
3. Clique em "Create Credentials" > "API Key"
4. Copie a chave gerada

### 3. Configurar Restrições (Recomendado)

Para segurança, configure restrições na chave:

- **Application restrictions**: HTTP referrers
- **Website restrictions**: Adicione seu domínio (ex: `localhost:5173`, `seudominio.com`)
- **API restrictions**: Selecione apenas "Places API" e "Maps JavaScript API"

### 4. Configurar Variável de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Google Maps API (opcional - para autocomplete de endereços)
VITE_GOOGLE_MAPS_API_KEY=sua_chave_aqui
```

## 🚀 Como Usar

### No Formulário de Assinatura

O sistema agora oferece duas opções para preenchimento de endereço:

1. **Busca por CEP**: Digite o CEP e o endereço será preenchido automaticamente
2. **Busca por Endereço**: Digite o endereço e use o autocomplete do Google

### Funcionalidades

- ✅ Autocomplete em tempo real
- ✅ Restrição ao Brasil
- ✅ Preenchimento automático de todos os campos
- ✅ Fallback para busca por CEP
- ✅ Tratamento de erros

## 🔒 Segurança

- A chave de API é exposta no frontend (necessário para o autocomplete)
- Use restrições de domínio para limitar o uso
- Monitore o uso no Google Cloud Console
- Considere implementar rate limiting no backend se necessário

## 💰 Custos

- **Places API**: Gratuito até 1.000 requisições/mês
- **Maps JavaScript API**: Gratuito até 28.000 carregamentos/mês
- Consulte a [tabela de preços](https://cloud.google.com/maps-platform/pricing) para mais detalhes

## 🐛 Troubleshooting

### Erro: "Google Maps API key não configurada"
- Verifique se a variável `VITE_GOOGLE_MAPS_API_KEY` está definida
- Reinicie o servidor de desenvolvimento

### Erro: "This API project is not authorized"
- Verifique se as APIs estão habilitadas no Google Cloud Console
- Confirme se a chave de API tem permissões adequadas

### Autocomplete não funciona
- Verifique se o domínio está nas restrições da chave
- Confirme se a Places API está habilitada
- Verifique o console do navegador para erros

## 📚 Recursos Adicionais

- [Documentação da Places API](https://developers.google.com/maps/documentation/places/web-service)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Restrições de API Key](https://developers.google.com/maps/api-key-restrictions)
