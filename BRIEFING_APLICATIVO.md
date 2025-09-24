# 📋 BRIEFING - Sistema de Gestão de Abaixo-Assinados

## 🎯 VISÃO GERAL

O **Sistema de Gestão de Abaixo-Assinados** é uma plataforma completa desenvolvida para a **Prefeitura de Joinville** que permite criar, gerenciar e coletar assinaturas tanto **fisicamente** quanto **online**, com total conformidade à **LGPD**.

---

## 🏗️ ARQUITETURA DO SISTEMA

### 🛠️ **Tecnologias Utilizadas**
- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Hospedagem:** Netlify (Frontend) + Supabase Cloud (Backend)
- **Autenticação:** Supabase Auth com controle de administradores

### 🗄️ **Banco de Dados**
- **Petições:** `petitions` (abaixo-assinados criados)
- **Assinaturas:** `signatures` (tabela única para todas as assinaturas)
- **Administradores:** `admin_users` (controle de acesso)
- **Kanban:** Tabelas para gerenciamento de tarefas

---

## 👥 TIPOS DE USUÁRIOS

### 🔐 **Administradores**
- **Acesso:** Login com email/senha
- **Permissões:** Criar, editar, gerenciar abaixo-assinados
- **Recursos:** Dashboard completo, Kanban, relatórios

### 🌐 **Público Geral**
- **Acesso:** Páginas públicas (sem login)
- **Permissões:** Apenas assinar abaixo-assinados online
- **Recursos:** Formulário de assinatura simplificado

---

## 🔄 FLUXOS PRINCIPAIS

### 📝 **1. CRIAÇÃO DE ABAIXO-ASSINADO (Admin)**

#### **Passo a Passo:**
1. **Login** no sistema administrativo
2. **Acesso** ao menu "Criar Abaixo-Assinado"
3. **Preenchimento** dos dados:
   - Nome da causa
   - Descrição detalhada
   - Local de coleta (opcional)
   - Data da coleta física (opcional)
   - Responsável pela coleta (opcional)
   - ☑️ **Disponibilizar online** (opcional)
4. **Salvamento** automático no banco de dados
5. **Criação automática** de tarefa no Kanban

#### **Resultado:**
- Abaixo-assinado criado no sistema
- URL única gerada: `/petition/[slug]`
- Tarefa criada na coluna "Coleta de assinaturas" do Kanban

### 🌐 **2. ASSINATURA ONLINE (Público)**

#### **Passo a Passo:**
1. **Acesso** à URL pública: `dominio.com/petition/[slug]`
2. **Visualização** da causa:
   - Nome do abaixo-assinado
   - Descrição da causa
   - Local (se informado)
   - Contador de assinaturas em destaque
3. **Preenchimento** do formulário:
   - Nome completo (obrigatório - mín. 2 nomes)
   - Telefone celular (obrigatório - validação rigorosa)
   - CEP (opcional - busca automática de endereço)
   - Endereço completo (preenchido automaticamente)
4. **Aceite** do termo LGPD (obrigatório)
5. **Validações** automáticas:
   - Nome completo válido
   - Telefone celular válido
   - Verificação de telefone duplicado
   - Consentimento LGPD aceito
6. **Salvamento** na tabela `signatures`
7. **Confirmação** com contagem regressiva
8. **Redirecionamento** para tonezi.com.br após 3 segundos

#### **Validações Implementadas:**
- ✅ **Nome:** Mínimo 2 palavras (nome + sobrenome)
- ✅ **Telefone:** 11 dígitos, 3º dígito = 9 (celular)
- ✅ **Duplicação:** Mesmo telefone não pode assinar a mesma petição
- ✅ **CEP:** Busca automática via ViaCEP
- ✅ **LGPD:** Consentimento obrigatório

### 📄 **3. COLETA FÍSICA (Admin)**

#### **Passo a Passo:**
1. **Acesso** ao abaixo-assinado no admin
2. **Aba "Exportar"** → "Documento para Coleta Física"
3. **Download** do arquivo HTML otimizado
4. **Impressão** do documento (1 página A4)
5. **Coleta** presencial de assinaturas
6. **Digitação** manual das assinaturas no sistema

#### **Documento Gerado:**
- **Cabeçalho:** Brasão PMJ + Título + Data
- **Informações:** Descrição e local da causa
- **Tabela:** 10 linhas para assinaturas manuais
- **Colunas:** Nome, Endereço, Telefone, Assinatura
- **Termo LGPD:** Completo e legível
- **Layout:** Otimizado para impressão A4

---

## 📊 FUNCIONALIDADES DETALHADAS

### 🏠 **Dashboard Administrativo**
- **Visão geral** de todas as petições
- **Estatísticas** de assinaturas
- **Acesso rápido** às funções principais
- **Cards informativos** com métricas

### 📋 **Gestão de Petições**
- **Lista completa** de abaixo-assinados
- **Filtros** e busca
- **Edição** de informações
- **Controle** de disponibilidade online
- **Exportação** de dados

### 📝 **Gestão de Assinaturas**
- **Visualização** de todas as assinaturas
- **Busca** por nome, telefone ou cidade
- **Edição** de dados coletados
- **Status** de mensagem enviada
- **Exportação** em CSV

### 📊 **Sistema Kanban**
- **Colunas personalizadas:**
  - Coleta de assinaturas
  - Gravação de vídeo
  - Edição e finalização
  - Entrega ao destinatário
  - Acompanhamento
- **Gestão visual** do progresso
- **Tarefas** com prioridades
- **Comentários** e anexos
- **Arquivamento** de tarefas concluídas

### 📈 **Relatórios e Analytics**
- **Gráficos** de crescimento de assinaturas
- **Estatísticas** por período
- **Exportação** de dados
- **Métricas** de engajamento

### ⚙️ **Configurações**
- **Gestão** de dados do sistema
- **Backup** e restauração
- **Configurações** de tema (claro/escuro)
- **Limpeza** de dados de teste

---

## 🔒 SEGURANÇA E CONFORMIDADE

### 🛡️ **Autenticação**
- **Login seguro** com email/senha
- **Controle de acesso** por usuário
- **Sessões** gerenciadas pelo Supabase
- **Logout** automático por inatividade

### ⚖️ **Conformidade LGPD**
- **Consentimento explícito** para coleta de dados
- **Finalidade específica** declarada
- **Termo personalizado** por abaixo-assinado
- **Direito** de exclusão de dados
- **Transparência** no tratamento

### 🔐 **Proteção de Dados**
- **Validação** rigorosa de inputs
- **Sanitização** de dados
- **Prevenção** de duplicações
- **Backup** seguro no Supabase

---

## 🌐 FLUXO HÍBRIDO (ONLINE + FÍSICO)

### 📱 **Coleta Online**
1. Admin cria abaixo-assinado
2. Marca como "disponível online"
3. Sistema gera URL pública
4. Público acessa e assina
5. Dados salvos automaticamente
6. Contador atualizado em tempo real

### 📄 **Coleta Física**
1. Admin exporta documento em branco
2. Imprime em A4 com brasão oficial
3. Coleta assinaturas presenciais
4. Digita manualmente no sistema
5. Dados unificados na mesma tabela

### 🔄 **Integração**
- **Tabela única** para todas as assinaturas
- **Diferenciação** por `petition_id`
- **Relatórios** unificados
- **Gestão** centralizada

---

## 📊 MÉTRICAS E CONTROLES

### 📈 **Indicadores Principais**
- **Total** de abaixo-assinados criados
- **Total** de assinaturas coletadas
- **Taxa** online vs. físico
- **Crescimento** por período
- **Engajamento** por causa

### 🎯 **Validações de Qualidade**
- **Telefones únicos** por petição
- **Dados obrigatórios** validados
- **Formato** de telefone celular
- **Nome completo** obrigatório
- **Consentimento LGPD** obrigatório

---

## 🚀 DIFERENCIAIS DO SISTEMA

### ✨ **Inovações Implementadas**
- **Busca automática** de endereço por CEP
- **Validação** de telefone celular
- **Prevenção** de duplicações
- **Redirecionamento** para site oficial
- **Contador** de assinaturas em destaque
- **Termo LGPD** personalizado por causa

### 🏛️ **Identidade Institucional**
- **Brasão oficial** da Prefeitura
- **Layout** profissional e institucional
- **Conformidade** legal garantida
- **Credibilidade** visual máxima

### 📱 **Experiência do Usuário**
- **Interface** intuitiva e moderna
- **Responsivo** para todos os dispositivos
- **Validações** em tempo real
- **Feedback** claro ao usuário
- **Processo** simplificado

---

## 🎯 CASOS DE USO PRINCIPAIS

### 🏛️ **Para Vereadores/Políticos**
- Criar campanhas de abaixo-assinados
- Gerenciar coleta híbrida (online + física)
- Acompanhar progresso no Kanban
- Gerar relatórios de engajamento
- Exportar dados para análise

### 👥 **Para a População**
- Assinar causas importantes online
- Processo rápido e seguro
- Dados protegidos pela LGPD
- Interface amigável e acessível

### 📊 **Para Gestão Pública**
- Métricas de participação cidadã
- Controle de demandas populares
- Relatórios de engajamento
- Gestão eficiente de campanhas

---

## 🔧 ADMINISTRAÇÃO DO SISTEMA

### 👨‍💼 **Usuários Administradores**
- **Matheus Mira:** matheus.mira@cvj.sc.gov.br
- **Adilson Martins:** adilson.martins.jlle@gmail.com

### 🌐 **Ambientes**
- **Produção:** Supabase Online
- **Desenvolvimento:** Supabase Local
- **Script:** `trocar-supabase.cjs` para alternar

### 📁 **Estrutura de Arquivos**
- **Frontend:** `/src` (React + TypeScript)
- **Componentes:** `/src/components`
- **Páginas:** `/src/pages`
- **Utilitários:** `/src/utils`
- **Tipos:** `/src/types`

---

## 🎉 RESUMO EXECUTIVO

O **Sistema de Gestão de Abaixo-Assinados** é uma solução completa que moderniza o processo de coleta de assinaturas para a **Prefeitura de Joinville**, oferecendo:

### ✅ **Benefícios Principais**
- **Eficiência:** Coleta online + física integrada
- **Conformidade:** LGPD totalmente implementada
- **Credibilidade:** Identidade visual institucional
- **Usabilidade:** Interface moderna e intuitiva
- **Gestão:** Kanban para acompanhamento
- **Relatórios:** Métricas e analytics completos

### 🎯 **Impacto Esperado**
- **Maior participação** cidadã (facilidade online)
- **Processo** mais eficiente e organizado
- **Conformidade** legal garantida
- **Credibilidade** institucional aumentada
- **Gestão** profissional de campanhas

---

## 📞 SUPORTE TÉCNICO

### 🔧 **Configurações**
- **Arquivo:** `CONFIGURACOES_SUPABASE_PRIVADO.md`
- **Scripts:** `trocar-supabase.cjs` para ambientes
- **Documentação:** Completa e atualizada

### 🚀 **Deploy**
- **Frontend:** Netlify automático via GitHub
- **Backend:** Supabase Cloud gerenciado
- **SSL:** Certificado automático
- **CDN:** Global para performance

---

**Sistema desenvolvido especificamente para as necessidades da Prefeitura de Joinville, combinando tecnologia moderna com conformidade legal e identidade institucional.**



