# Brasão da Prefeitura de Joinville - IMPLEMENTADO

## ✅ Logo Oficial Já Configurado

O brasão oficial da Prefeitura Municipal de Joinville já está implementado no documento usando a URL oficial:
`https://cdn.freebiesupply.com/logos/large/2x/prefeitura-municipal-de-joinville-logo-png-transparent.png`

## Backup - Passos para substituir caso necessário:

### 1. Converter a imagem do brasão para Base64
- Salve a imagem do brasão em formato PNG ou JPG
- Use um conversor online como: https://www.base64-image.de/
- Ou use o comando no terminal: `base64 -i brasao-joinville.png`

### 2. Substituir no código
No arquivo `src/pages/PetitionDetail.tsx`, procure por esta linha:

```html
<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjMDA2NkNDIi8+CjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjIwIiBmaWxsPSIjRkZGRkZGIi8+Cjx0ZXh0IHg9IjMwIiB5PSIzNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjMDA2NkNDIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5KVkU8L3RleHQ+Cjwvc3ZnPgo="
```

E substitua por:

```html
<img src="data:image/png;base64,SEU_BASE64_AQUI"
```

### 3. Exemplo de substituição:
```html
<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..." 
     alt="Brasão de Joinville" 
     style="width: 100%; height: 100%; object-fit: contain;" />
```

### 4. Alternativa: Usar URL externa
Se preferir, pode usar uma URL da imagem hospedada:

```html
<img src="https://exemplo.com/brasao-joinville.png" 
     alt="Brasão de Joinville" 
     style="width: 100%; height: 100%; object-fit: contain;" />
```

## Características do logo no documento:
- **Posição**: Canto superior esquerdo
- **Tamanho**: 60x60px (tela) / 50x50px (impressão)
- **Formato**: Recomendado PNG com fundo transparente
- **Qualidade**: Alta resolução para impressão nítida
