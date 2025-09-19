# Plano: Modal Completo Estilo Trello

## 🎯 OBJETIVO
Melhorar o modal atual do Kanban para ter **todas as funcionalidades do Trello**, mantendo o **Kanban global** mas com cartões completos.

## ✅ O QUE JÁ ESTÁ IMPLEMENTADO NO MODAL

### Funcionalidades Básicas
- ✅ **Título editável** inline
- ✅ **Descrição** editável
- ✅ **Comentários** básicos (adicionar/visualizar)
- ✅ **Responsáveis** (adicionar/remover)
- ✅ **Etiquetas** (adicionar/remover)
- ✅ **Prioridade** (baixa/média/alta)
- ✅ **Prazo** com cores (atrasado/hoje/sem prazo)
- ✅ **Arquivar** tarefa

## ❌ O QUE ESTÁ FALTANDO NO MODAL

### 1. **CHECKLIST COMPLETO**
- ❌ Interface para criar/gerenciar checklists
- ❌ Itens de checklist com marcação
- ❌ Progresso do checklist (X/Y itens)
- ❌ Exibição do progresso no cartão

### 2. **ANEXOS**
- ❌ Upload de arquivos
- ❌ Links externos
- ❌ Visualização de anexos
- ❌ Download de arquivos

### 3. **ATIVIDADE/HISTÓRICO**
- ❌ Log de atividades (quem fez o quê, quando)
- ❌ Histórico de mudanças
- ❌ Timeline de atividades

### 4. **MELHORIAS NO MODAL**
- ❌ **Layout estilo Trello** (sidebar direita com atividade)
- ❌ **Comentários com @menções**
- ❌ **Ações rápidas** (duplicar, mover, copiar)
- ❌ **Filtros** no modal
- ❌ **Busca** dentro do modal

## 🚀 PLANO DE IMPLEMENTAÇÃO

### FASE 1: CHECKLIST COMPLETO (Prioridade ALTA)

#### 1.1 Interface de Checklist
**Arquivo:** `src/components/KanbanTaskModal.tsx`
- [ ] **Seção de Checklist** no modal
- [ ] **Botão "Adicionar Checklist"**
- [ ] **Lista de checklists** com itens
- [ ] **Marcar/desmarcar** itens
- [ ] **Progresso visual** (X/Y itens)

#### 1.2 Funções de Checklist
**Arquivo:** `src/utils/kanban-storage.ts`
- [ ] `createKanbanChecklist(taskId, title)`
- [ ] `getKanbanChecklists(taskId)`
- [ ] `createKanbanChecklistItem(checklistId, text)`
- [ ] `toggleChecklistItem(itemId, completed)`
- [ ] `deleteKanbanChecklistItem(itemId)`

### FASE 2: ANEXOS (Prioridade ALTA)

#### 2.1 Interface de Anexos
**Arquivo:** `src/components/KanbanTaskModal.tsx`
- [ ] **Seção de Anexos** no modal
- [ ] **Upload de arquivos** (drag & drop)
- [ ] **Adicionar links** externos
- [ ] **Lista de anexos** com preview
- [ ] **Download/remover** anexos

#### 2.2 Funções de Anexos
**Arquivo:** `src/utils/kanban-storage.ts`
- [ ] `addKanbanAttachment(taskId, type, url, fileName)`
- [ ] `getKanbanAttachments(taskId)`
- [ ] `deleteKanbanAttachment(attachmentId)`
- [ ] `uploadFileToSupabase(file)` (se necessário)

### FASE 3: ATIVIDADE/HISTÓRICO (Prioridade MÉDIA)

#### 3.1 Interface de Atividade
**Arquivo:** `src/components/KanbanTaskModal.tsx`
- [ ] **Sidebar de Atividade** (lado direito)
- [ ] **Timeline de atividades**
- [ ] **Filtros de atividade** (todos, comentários, mudanças)
- [ ] **Formatação de atividades** (quem, o quê, quando)

#### 3.2 Funções de Atividade
**Arquivo:** `src/utils/kanban-storage.ts`
- [ ] `getKanbanActivities(taskId)`
- [ ] `logKanbanActivity(taskId, type, data)`
- [ ] **Auto-log** em mudanças (mover, editar, etc.)

### FASE 4: MELHORIAS NO MODAL (Prioridade MÉDIA)

#### 4.1 Layout Estilo Trello
**Arquivo:** `src/components/KanbanTaskModal.tsx`
- [ ] **Layout 2 colunas** (conteúdo + sidebar)
- [ ] **Sidebar fixa** com atividade
- [ ] **Header melhorado** com ações
- [ ] **Responsividade** otimizada

#### 4.2 Funcionalidades Avançadas
**Arquivo:** `src/components/KanbanTaskModal.tsx`
- [ ] **Comentários com @menções**
- [ ] **Ações rápidas** (duplicar, mover, copiar)
- [ ] **Filtros** no modal
- [ ] **Busca** dentro do modal

## 📋 IMPLEMENTAÇÃO DETALHADA

### 1. CHECKLIST COMPLETO

#### Interface no Modal:
```tsx
{/* Checklist Section */}
<div className="mb-6">
  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
    Checklist
  </h3>
  
  {/* Lista de Checklists */}
  {editedTask.checklists?.map(checklist => (
    <div key={checklist.id} className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <CheckSquare size={16} />
        <span className="font-medium">{checklist.title}</span>
        <span className="text-sm text-gray-500">
          ({checklist.items?.filter(i => i.isCompleted).length || 0}/{checklist.items?.length || 0})
        </span>
      </div>
      
      {/* Itens do Checklist */}
      <div className="space-y-1 ml-6">
        {checklist.items?.map(item => (
          <div key={item.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={item.isCompleted}
              onChange={() => toggleChecklistItem(item.id, !item.isCompleted)}
              className="rounded"
            />
            <span className={item.isCompleted ? 'line-through text-gray-500' : ''}>
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  ))}
  
  {/* Botão Adicionar Checklist */}
  <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm">
    <Plus size={14} />
    Adicionar Checklist
  </button>
</div>
```

### 2. ANEXOS

#### Interface no Modal:
```tsx
{/* Anexos Section */}
<div className="mb-6">
  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
    Anexos ({editedTask.attachments?.length || 0})
  </h3>
  
  {/* Lista de Anexos */}
  <div className="space-y-2">
    {editedTask.attachments?.map(attachment => (
      <div key={attachment.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
        <Paperclip size={16} />
        <span className="text-sm">{attachment.fileName || attachment.url}</span>
        <button onClick={() => deleteAttachment(attachment.id)} className="text-red-500">
          <X size={14} />
        </button>
      </div>
    ))}
  </div>
  
  {/* Botões de Adicionar */}
  <div className="flex gap-2 mt-2">
    <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm">
      <Plus size={14} />
      Adicionar Arquivo
    </button>
    <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm">
      <Plus size={14} />
      Adicionar Link
    </button>
  </div>
</div>
```

### 3. ATIVIDADE/HISTÓRICO

#### Interface no Modal:
```tsx
{/* Sidebar de Atividade */}
<div className="lg:col-span-1">
  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
    Comentários e atividade
  </h3>
  
  {/* Filtros de Atividade */}
  <div className="mb-4">
    <select className="w-full text-sm border rounded px-2 py-1">
      <option value="all">Todas as atividades</option>
      <option value="comments">Comentários</option>
      <option value="changes">Mudanças</option>
    </select>
  </div>
  
  {/* Timeline de Atividades */}
  <div className="space-y-3">
    {editedTask.activities?.map(activity => (
      <div key={activity.id} className="text-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">{activity.actor?.email}</span>
          <span className="text-gray-500">
            {new Date(activity.createdAt).toLocaleString('pt-BR')}
          </span>
        </div>
        <p className="text-gray-700 dark:text-gray-300">
          {formatActivity(activity)}
        </p>
      </div>
    ))}
  </div>
</div>
```

## 🎯 CRITÉRIOS DE SUCESSO

### Funcionalidades Obrigatórias
- [ ] **Checklist completo** funciona (criar, marcar, progresso)
- [ ] **Anexos** funcionam (upload, links, visualizar)
- [ ] **Atividade** funciona (log, timeline, filtros)
- [ ] **Layout estilo Trello** implementado
- [ ] **Responsividade** funciona

### Funcionalidades Desejáveis
- [ ] **@menções** em comentários
- [ ] **Ações rápidas** (duplicar, mover, copiar)
- [ ] **Filtros avançados** no modal
- [ ] **Busca** dentro do modal

## 📊 STATUS ATUAL: 60% IMPLEMENTADO

**O que funciona:**
- ✅ Modal básico com título, descrição, comentários
- ✅ Responsáveis, etiquetas, prioridade, prazo
- ✅ Estrutura de banco completa

**O que falta:**
- ❌ Checklist completo
- ❌ Anexos
- ❌ Atividade/histórico
- ❌ Layout estilo Trello
- ❌ Funcionalidades avançadas

## 🚀 PRÓXIMOS PASSOS

1. **Implementar Checklist** (FASE 1)
2. **Implementar Anexos** (FASE 2)
3. **Implementar Atividade** (FASE 3)
4. **Melhorar Layout** (FASE 4)
5. **Testar integração** completa

**O modal atual já tem uma boa base, mas precisa das funcionalidades principais do Trello para estar completo.**



