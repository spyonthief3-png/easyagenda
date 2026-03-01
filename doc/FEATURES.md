# Mapa de Funcionalidades (v1.1.0)

Este catálogo define o escopo operacional do **EasyAgenda**, vinculando funcionalidades a status de implementação, papéis de acesso e regras de negócio.

---

## 1. Módulo: Reservas (Bookings)

| Funcionalidade | Status | Papéis | Rota / Tela | Regras / Escopo |
| :--- | :--- | :---: | :--- | :--- |
| **Grade de Disponibilidade** | ✅ | ALL | `/` | Visualização em slots fixos. Cores mapeiam status (Available, Booked, etc). |
| **Visão Multimodal** | ✅ | ALL | `/` | Alternância de contexto: Dia (Grade), Semana (Densidade), Mês (Calendário). |
| **Criar Reserva** | ✅ | ALL | `/` | Impede: Datas passadas, Domingos, Feriados, Blackouts e **Conflito de agenda do usuário**. |
| **Encontrar Horário Livre** | ✅ | ALL | `/find-slot` | Algoritmo de busca por "Primeiro Disponível" com filtros de Local e Tipo. |
| **Minhas Reservas** | ✅ | ALL | `/my-bookings`| Listagem cronológica de agendamentos futuros do próprio usuário. |
| **Cancelar Própria Reserva** | ✅ | ALL | `/my-bookings`| Transição de status para `CANCELLED`. Slot é liberado imediatamente. |
| **Cancelar Qualquer Reserva**| ✅ | ADMIN | `/admin/bookings` | Sobrecarga de autoridade. Permite remover reservas de terceiros. |
| **Editar Reserva** | 📅 | - | - | **Roadmap**: Atualmente o fluxo exige cancelar e criar nova para garantir integridade. |

---

## 2. Módulo: Manutenção (Maintenance)

| Funcionalidade | Status | Papéis | Rota / Tela | Regras / Escopo |
| :--- | :--- | :---: | :--- | :--- |
| **Reportar Problema** | ✅ | ALL | (Global UI) | Botão de alerta presente na Grade e em Minhas Reservas. Exige categoria. |
| **Painel de Chamados** | ✅ | MAINT, ADMIN | `/maintenance/issues` | Visão tabular de incidentes. Filtros por Status (Open, In Progress, Resolved). |
| **Resolver Chamado** | ✅ | MAINT, ADMIN | `/maintenance/issues` | Exige `resolutionNotes`. Registra timestamp de solução (`resolvedAt`). |
| **Bloqueio por Intervalo** | ✅ | MAINT, ADMIN | `/maintenance/blocks` | Interdição de múltiplos dias para reformas ou manutenções programadas. |
| **Bloqueio Pontual** | ✅ | ADMIN | `/admin/holidays-blackouts` | Bloqueio de slot específico (Ex: Palestra externa). |

---

## 3. Módulo: Administração (Admin)

| Funcionalidade | Status | Papéis | Rota / Tela | Regras / Escopo |
| :--- | :--- | :---: | :--- | :--- |
| **Gestão de Usuários** | ✅ | ADMIN | `/admin/users` | CRUD completo. Bloqueio de auto-exclusão para o usuário logado. |
| **Gestão de Salas** | ✅ | ADMIN | `/admin/rooms` | CRUD. Gerencia capacidade, recursos técnicos e flag `isActive`. |
| **Gestão de Locais (Blocos)**| ✅ | ADMIN | `/admin/locations` | CRUD. Impede exclusão se houver salas vinculadas ao local. |
| **Gestão de Tipos de Sala** | ✅ | ADMIN | `/admin/room-types` | CRUD. Categorização (Laboratório, Auditório, etc). |
| **Gestão de Feriados** | ✅ | ADMIN | `/admin/holidays-blackouts` | Datas globais de interdição total do sistema. |
| **Dashboard de Uso** | ✅ | ADMIN | `/admin/reports` | Gráficos de ocupação, ranking de salas e usuários mais ativos. |
| **Logs de Auditoria** | ✅ | ADMIN | `/admin/audit-logs` | Histórico **Append-Only** na UI. Persistência volátil no Mock. |
| **Exportar Dados** | 📅 | ADMIN | - | **Roadmap**: Exportação de relatórios para CSV/PDF. |

---

## 4. Segurança e Perfil

| Funcionalidade | Status | Papéis | Rota / Tela | Regras / Escopo |
| :--- | :--- | :---: | :--- | :--- |
| **Autenticação (Mock)** | ✅ | - | `/login` | Validação de credenciais mockadas. Persistência em `localStorage`. |
| **Logout** | ✅ | ALL | (Navbar) | Limpeza de `localStorage` e redirecionamento para login. |
| **Edição de Perfil** | ✅ | ALL | `/profile` | Alteração de Nome, Email e URL da Foto. |
| **Troca de Senha** | ✅ | ALL | `/profile` | Exige validação da senha atual. |

---

## 5. Funcionalidades Transversais (Sistêmicas)

-   **Busca e Filtros**: Presentes em salas, chamados, reservas e logs. Suportam combinação de múltiplos critérios.
-   **Feedback de Operação**: Toasts/Alertas de sucesso/erro após cada ação de escrita (POST/PUT/DELETE).
-   **Loading States**: Uso de Spinners em tabelas e botões para indicar processamento assíncrono.
-   **Responsividade**: Interface adaptada para Desktop e dispositivos Mobile (Layout Mobile-First).
-   **Configurações Globais**: Períodos (M1-N2) e bloqueio de domingos são **Hardcoded** na v1.1.0.