# Plano de Implementação - Kanban por Abaixo-Assinado

## 🎯 OBJETIVO
Implementar aba "Tarefas (Kanban)" dentro do detalhe de cada abaixo-assinado, conforme especificação completa.

## 📋 FASES DE IMPLEMENTAÇÃO

### FASE 1: ESTRUTURA BÁSICA (Prioridade ALTA)

#### 1.1 Adicionar Aba "Tarefas" no PetitionDetail
**Arquivo:** `src/pages/PetitionDetail.tsx`
- [ ] Adicionar 'tasks' ao tipo `activeTab`
- [ ] Adicionar aba "Tarefas (Kanban)" no array de abas
- [ ] Implementar conteúdo da aba tasks
- [ ] Importar componente KanbanBoard

#### 1.2 Board Específico por Abaixo-Assinado
**Arquivos:** `src/utils/kanban-storage.ts`, `src/components/KanbanBoard.tsx`
- [ ] Modificar `getGlobalKanbanBoard()` para aceitar `petitionId`
- [ ] Criar função `getPetitionKanbanBoard(petitionId)`
- [ ] Modificar `KanbanBoardComponent` para aceitar `petitionId` como prop
- [ ] Atualizar lógica de criação de board específico

#### 1.3 Colunas Padrão Específicas
**Arquivo:** `src/utils/kanban-storage.ts`
- [ ] Criar função `createDefaultColumnsForPetition(petitionId)`
- [ ] Implementar colunas exatas da especificação:
  - Coleta de assinaturas
  - Gravação de vídeo
  - Disparo de mensagem
  - Apresentar ao poder público
  - Aguardar retorno
  - Dar retorno à população
  - Atividades extras

### FASE 2: INTERFACE DE TAREFAS (Prioridade ALTA)

#### 2.1 Modal Completo de Tarefa
**Arquivo:** `src/components/KanbanTaskModal.tsx`
- [ ] **Descrição rich-text** simples
- [ ] **Responsáveis**: Seleção de usuários do workspace
- [ ] **Etiquetas**: Criar/atribuir etiquetas
- [ ] **Checklist**: Itens com marcação e contagem
- [ ] **Anexos**: URL/arquivo
- [ ] **Comentários**: Com @menções
- [ ] **Histórico de atividade**

#### 2.2 Sistema de Responsáveis
**Arquivos:** `src/utils/kanban-storage.ts`, `src/components/`
- [ ] Função `getKanbanTaskAssignees(taskId)`
- [ ] Função `assignUserToTask(taskId, userId)`
- [ ] Função `removeUserFromTask(taskId, userId)`
- [ ] Componente `TaskAssignees` para interface

#### 2.3 Sistema de Etiquetas
**Arquivos:** `src/utils/kanban-storage.ts`, `src/components/`
- [ ] Função `getKanbanLabels(boardId)`
- [ ] Função `createKanbanLabel(boardId, name, color)`
- [ ] Função `assignLabelToTask(taskId, labelId)`
- [ ] Componente `TaskLabels` para interface

#### 2.4 Sistema de Checklist
**Arquivos:** `src/utils/kanban-storage.ts`, `src/components/`
- [ ] Função `getKanbanChecklists(taskId)`
- [ ] Função `createKanbanChecklist(taskId, title)`
- [ ] Função `createKanbanChecklistItem(checklistId, text)`
- [ ] Função `toggleChecklistItem(itemId, completed)`
- [ ] Componente `TaskChecklist` para interface

### FASE 3: FUNCIONALIDADES AVANÇADAS (Prioridade MÉDIA)

#### 3.1 Sistema de Anexos
**Arquivos:** `src/utils/kanban-storage.ts`, `src/components/`
- [ ] Função `getKanbanAttachments(taskId)`
- [ ] Função `addKanbanAttachment(taskId, type, url, fileName)`
- [ ] Função `deleteKanbanAttachment(attachmentId)`
- [ ] Componente `TaskAttachments` para interface

#### 3.2 Sistema de Comentários
**Arquivos:** `src/utils/kanban-storage.ts`, `src/components/`
- [ ] Função `getKanbanComments(taskId)`
- [ ] Função `addKanbanComment(taskId, content)`
- [ ] Função `deleteKanbanComment(commentId)`
- [ ] Componente `TaskComments` para interface
- [ ] Sistema de @menções

#### 3.3 Filtros e Busca Avançada
**Arquivo:** `src/components/KanbanFilters.tsx`
- [ ] Filtro por responsável
- [ ] Filtro por etiqueta
- [ ] Filtro por coluna
- [ ] Filtro por prazo (atrasados/hoje/semana)
- [ ] Filtro por prioridade
- [ ] Busca de texto em tempo real
- [ ] Filtro de tarefas arquivadas

### FASE 4: AÇÕES RÁPIDAS (Prioridade MÉDIA)

#### 4.1 Ações de Tarefa
**Arquivos:** `src/components/KanbanTaskCard.tsx`, `src/utils/kanban-storage.ts`
- [ ] **Editar título inline** (duplo clique)
- [ ] **Duplicar cartão** (clonar descrição, etiquetas, checklist)
- [ ] **Mover/copiar** entre colunas
- [ ] **Arquivar/restaurar** tarefas
- [ ] **Configurar colunas** (renomear, reordenar, ocultar)

#### 4.2 Configuração de Colunas
**Arquivo:** `src/components/KanbanColumnSettings.tsx`
- [ ] Renomear coluna inline
- [ ] Reordenar colunas (drag & drop)
- [ ] Ocultar/mostrar colunas
- [ ] Criar novas colunas
- [ ] Limite máximo de colunas (20)

### FASE 5: PERMISSÕES E SEGURANÇA (Prioridade ALTA)

#### 5.1 Verificação de Permissões
**Arquivos:** `src/utils/kanban-storage.ts`, `src/components/`
- [ ] Função `canUserManagePetition(petitionId, userId)`
- [ ] Verificar se usuário é dono do abaixo-assinado
- [ ] Verificar se usuário é admin
- [ ] Restringir ações baseadas em permissões

#### 5.2 RLS (Row Level Security)
**Arquivo:** `supabase/migrations/`
- [ ] Políticas RLS para boards específicos por petition
- [ ] Políticas RLS para tarefas baseadas no dono do petition
- [ ] Políticas RLS para responsáveis, etiquetas, etc.

### FASE 6: EXPORT E INTEGRAÇÕES (Prioridade BAIXA)

#### 6.1 Export CSV
**Arquivo:** `src/utils/kanban-export.ts`
- [ ] Função `exportKanbanTasksToCSV(boardId, filters)`
- [ ] Exportar tarefas filtradas
- [ ] Incluir responsáveis, etiquetas, prazos

#### 6.2 Webhooks (Preparação)
**Arquivo:** `src/utils/kanban-webhooks.ts`
- [ ] Função `triggerKanbanWebhook(event, data)`
- [ ] Eventos: create, move, update, assign, comment
- [ ] Preparar estrutura para integrações futuras

### FASE 7: UX/UI E RESPONSIVIDADE (Prioridade MÉDIA)

#### 7.1 Responsividade
**Arquivos:** `src/components/KanbanBoard.tsx`, `src/components/KanbanColumn.tsx`
- [ ] Colunas scroll horizontal em mobile
- [ ] Cards responsivos
- [ ] Modal responsivo

#### 7.2 Acessibilidade
**Arquivos:** Todos os componentes
- [ ] Foco visível em todos os elementos
- [ ] Drag handle acessível ao teclado
- [ ] aria-labels em botões e listas
- [ ] Navegação por teclado

#### 7.3 Atalhos de Teclado
**Arquivo:** `src/hooks/useKanbanKeyboard.ts`
- [ ] N - Novo cartão
- [ ] F - Abrir filtros
- [ ] Escape - Fechar modal
- [ ] Enter - Salvar edições

## 🚀 CRONOGRAMA SUGERIDO

### Semana 1: FASE 1 + 2.1
- Aba "Tarefas" no PetitionDetail
- Board específico por petition
- Colunas padrão
- Modal básico de tarefa

### Semana 2: FASE 2.2 + 2.3 + 2.4
- Sistema de responsáveis
- Sistema de etiquetas  
- Sistema de checklist

### Semana 3: FASE 3 + 4
- Sistema de anexos e comentários
- Filtros avançados
- Ações rápidas

### Semana 4: FASE 5 + 6 + 7
- Permissões e segurança
- Export CSV
- Responsividade e acessibilidade

## 📊 CRITÉRIOS DE SUCESSO

### Funcionalidades Obrigatórias
- [ ] Aba "Tarefas (Kanban)" aparece no detalhe do abaixo-assinado
- [ ] Board específico por petition carrega corretamente
- [ ] Colunas padrão criadas automaticamente
- [ ] Cartões podem ser criados, editados, arrastados
- [ ] Responsáveis, etiquetas, checklist funcionam
- [ ] Filtros e busca funcionam
- [ ] Permissões respeitadas (apenas dono/admin)
- [ ] UI responsiva sem tela branca

### Funcionalidades Desejáveis
- [ ] Export CSV funciona
- [ ] Anexos e comentários funcionam
- [ ] Ações rápidas funcionam
- [ ] Atalhos de teclado funcionam
- [ ] Acessibilidade implementada

## 🔧 ARQUIVOS PRINCIPAIS A MODIFICAR

### Novos Arquivos
- `src/components/KanbanTaskAssignees.tsx`
- `src/components/KanbanTaskLabels.tsx`
- `src/components/KanbanTaskChecklist.tsx`
- `src/components/KanbanTaskAttachments.tsx`
- `src/components/KanbanTaskComments.tsx`
- `src/components/KanbanColumnSettings.tsx`
- `src/utils/kanban-export.ts`
- `src/utils/kanban-webhooks.ts`
- `src/hooks/useKanbanKeyboard.ts`

### Arquivos a Modificar
- `src/pages/PetitionDetail.tsx` (adicionar aba)
- `src/components/KanbanBoard.tsx` (aceitar petitionId)
- `src/components/KanbanTaskModal.tsx` (interface completa)
- `src/utils/kanban-storage.ts` (novas funções)
- `supabase/migrations/` (novas políticas RLS)



