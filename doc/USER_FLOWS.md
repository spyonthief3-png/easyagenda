# Fluxos de Usuário (User Flows) — v1.1.0

Este documento formaliza as jornadas críticas do **EasyAgenda**. Ele serve como base para roteiros de teste (QA) e validação de requisitos.

---

## 1. Módulo: Autenticação e Sistema (Transversal)

### 1.1 Fluxo: Login e Sessão
- **Persona**: ALL
- **Rota**: `/login`
- **Passos**:
    1. Inserir credenciais válidas (ex: `john.doe` / `password`).
    2. Clicar em "Entrar".
- **Resultado Esperado**: Redirecionamento para `/`; Dados do usuário salvos no `localStorage`.
- **Exceção**: Credenciais inválidas exibem erro visual "Nome de usuário ou senha inválidos".

### 1.2 Fluxo: Logout
- **Persona**: ALL
- **Ação**: Clicar em "Sair" na Navbar.
- **Resultado Esperado**: `localStorage` limpo; Redirecionamento imediato para `/login`.

---

## 2. Jornadas da Persona: USER (Colaborador)

### 2.1 Fluxo: Reservar Sala (Fluxo Feliz)
- **Rota**: `/`
- **Pré-condições**: Slot alvo está `AVAILABLE` (Verde); Usuário sem reserva no mesmo date/periodCode.
- **Passos**:
    1. Clicar no slot.
    2. Preencher "Título da Reserva" (Obrigatório).
    3. Confirmar.
- **Resultado Esperado**: Slot vira `MY_BOOKING` (Azul); Reserva aparece em `/my-bookings`.
- **API/Audit**: `api.createBooking` / `CREATE_BOOKING`.

### 2.2 Fluxo: Reservar Sala (Exceções de Bloqueio)
- **Cenários de Falha**:
    - **Conflito de Agenda**: Tentar reservar tendo outra reserva no mesmo período. -> **Erro**: "Você já possui uma reserva neste período."
    - **Data Passada**: Tentar reservar em data < hoje. -> **Erro**: "Não é possível realizar reservas para datas passadas."
    - **Slot Ocupado**: Tentar reservar via modal em slot que mudou para `BOOKED` (Red) enquanto o modal estava aberto. -> **Erro**: "Esta sala já está reservada."

### 2.3 Fluxo: Encontrar Horário Livre (Busca)
- **Rota**: `/find-slot`
- **Passos**:
    1. Selecionar Data e filtros de Localização/Tipo.
    2. Visualizar lista de salas com períodos livres.
    3. Clicar em "Agendar" em um dos resultados.
- **Resultado Esperado**: Abertura do modal de reserva com contexto pré-preenchido.

### 2.4 Fluxo: Cancelar Própria Reserva
- **Rota**: `/my-bookings`
- **Passos**:
    1. Clicar em "Cancelar Reserva".
    2. (Opcional) Inserir motivo no prompt.
- **Resultado Esperado**: Reserva some da lista; Slot na Home volta a ser `AVAILABLE` (Verde).
- **Audit**: `CANCEL_BOOKING`.

### 2.5 Fluxo: Reportar Problema
- **Contexto**: Navbar ou Detalhe da Sala.
- **Passos**:
    1. Clicar no ícone de alerta (Triângulo Amarelo).
    2. Selecionar Categoria e descrever o problema.
- **Resultado Esperado**: Toast de sucesso "Problema reportado!"; Chamado criado como `OPEN` (Aberto).
- **API**: `api.createIssueReport`.

---

## 3. Jornadas da Persona: MAINTENANCE (Técnico)

### 3.1 Fluxo: Bloqueio de Sala por Intervalo
- **Rota**: `/maintenance/blocks`
- **Passos**:
    1. Preencher Motivo, Sala e Intervalo (Início e Fim).
    2. Salvar.
- **Resultado Esperado**: Múltiplos slots na grade passam para `BLACKOUT` (Amarelo).
- **Erro de Validação**: Se `startDate > endDate`, exibir "A data de início não pode ser posterior à data de término."

### 3.2 Fluxo: Gestão de Chamados Técnicos
- **Rota**: `/maintenance/issues`
- **Passos**:
    1. Filtrar chamados por status "Aberto".
    2. Clicar em "Atualizar" -> Mudar para "Em Andamento".
    3. Ao concluir, mudar para "Resolvido" e preencher "Notas de Resolução".
- **Resultado Esperado**: Chamado arquivado com timestamp `resolvedAt`.
- **Regra**: Impedir status "Resolvido" sem notas de resolução.

---

## 4. Jornadas da Persona: ADMIN (Gestor)

### 4.1 Fluxo: Cancelamento de Terceiros (Escopo Global)
- **Rota**: `/admin/bookings`
- **Passos**: 
    1. Localizar reserva de qualquer usuário na lista.
    2. Clicar em "Cancelar".
- **Resultado Esperado**: Reserva cancelada (Status `CANCELLED`).
- **Audit**: `CANCEL_BOOKING` registrado com o ID do Admin como ator.

### 4.2 Fluxo: Gestão de Infraestrutura (CRUD)
- **Rota**: `/admin/rooms`, `/admin/locations`, `/admin/room-types`.
- **Passos**: Criar, Editar ou Excluir registros.
- **Regra de Integridade**: Impedir exclusão de Localização ou Tipo se houver salas atreladas (Exibir erro 400).
- **Visibilidade**: Se `room.isActive = false`, a sala some da grade para USER, mas permanece visível para ADMIN.

### 4.3 Fluxo: Gestão de Feriados Globais
- **Rota**: `/admin/holidays-blackouts`
- **Passos**: Adicionar data e nome do feriado.
- **Resultado Esperado**: Todas as salas do sistema ficam com status `HOLIDAY` (Roxo) naquela data.

### 4.4 Fluxo: Revisão de Auditoria
- **Rota**: `/admin/audit-logs`
- **Passos**: Consultar a lista de ações recentes.
- **Resultado Esperado**: Visualização cronológica imutável. No mock, garantir que o log persiste durante a sessão do navegador.