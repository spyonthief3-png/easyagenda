# Papéis e Permissões (RBAC) — v1.1.0

Este documento define os papéis do sistema e suas permissões. Ele serve como fonte de verdade para:
1.  **Renderização condicional da UI** (menus, botões, abas).
2.  **Proteção de rotas** (`ProtectedRoute`).
3.  **Validação de autorização** no backend (na migração do mock para API real).

**Importante**: UI não é segurança. Mesmo no mock, as regras devem ser aplicadas na Service Layer. No backend real, todas as validações devem ser replicadas server-side.

---

## 1. Papéis (Roles)

### 1.1 USER (Usuário Comum)
-   **Objetivo**: Produtividade pessoal (consultar salas e realizar agendamentos).
-   **Acesso a telas**: Home, Encontrar Horário, Minhas Reservas, Perfil.
-   **Ações principais**: Visualizar disponibilidade, criar reserva, cancelar a própria reserva, reportar problema (chamado).

### 1.2 MAINTENANCE (Equipe de Manutenção)
-   **Objetivo**: Integridade do patrimônio (bloquear salas para reparos e resolver incidentes).
-   **Acesso a telas**: Tudo do USER + Painel de Chamados, Bloqueios de Manutenção.
-   **Ações principais**: Alterar status de chamados, adicionar notas de resolução (obrigatórias ao finalizar), criar bloqueio por intervalo para manutenção.

### 1.3 ADMIN (Administrador)
-   **Objetivo**: Governança, auditoria e configuração global do sistema.
-   **Acesso a telas**: Acesso total (incluindo gestão de usuários, salas e logs).
-   **Ações principais**: Gerenciar usuários, salas, tipos, localizações, feriados, visualizar auditoria, acessar dashboard e cancelar qualquer reserva.

---

## 2. Matriz de Permissões por Ação

| Ação | USER | MAINTENANCE | ADMIN | Observações |
| :--- | :---: | :---: | :---: | :--- |
| Ver disponibilidade (grade/mês) | ✅ | ✅ | ✅ | Leitura |
| Encontrar primeiro horário livre | ✅ | ✅ | ✅ | Leitura |
| Criar reserva | ✅ | ✅ | ✅ | Sujeito a conflitos |
| Cancelar própria reserva | ✅ | ✅ | ✅ | Permitido |
| Cancelar reserva de terceiros | ❌ | ❌ | ✅ | Somente ADMIN |
| Criar chamado (issue report) | ✅ | ✅ | ✅ | Qualquer autenticado |
| Atualizar status de chamado | ❌ | ✅ | ✅ | Manutenção/Admin |
| Finalizar chamado (RESOLVIDO) | ❌ | ✅ | ✅ | Exige `resolutionNotes` |
| Criar blackout pontual | ❌ | ✅ | ✅ | Manutenção/Admin |
| Criar blackout por intervalo | ❌ | ✅ | ✅ | Manutenção/Admin |
| Criar feriado (global) | ❌ | ❌ | ✅ | Admin |
| Ver auditoria (logs) | ❌ | ❌ | ✅ | Admin |
| Gerenciar Salas/Locais/Tipos | ❌ | ❌ | ✅ | Admin |
| Gerenciar usuários | ❌ | ❌ | ✅ | Admin |
| Ver dashboard/relatórios | ❌ | ❌ | ✅ | Admin |

---

## 3. Matriz por Rotas (ProtectedRoute)

| Rota | USER | MAINTENANCE | ADMIN |
| :--- | :---: | :---: | :---: |
| `/` (Home) | ✅ | ✅ | ✅ |
| `/find-slot` | ✅ | ✅ | ✅ |
| `/my-bookings` | ✅ | ✅ | ✅ |
| `/profile` | ✅ | ✅ | ✅ |
| `/maintenance/issues` | ❌ | ✅ | ✅ |
| `/maintenance/blocks` | ❌ | ✅ | ✅ |
| `/admin/*` (todas as rotas admin) | ❌ | ❌ | ✅ |

---

## 4. Regras de Escopo (Own vs Any)

-   **Reservas**: Usuários com papel `USER` ou `MAINTENANCE` podem cancelar apenas reservas onde `booking.userId === currentUserId`. O papel `ADMIN` tem escopo global e pode cancelar qualquer reserva.
-   **Chamados**: Apenas `MAINTENANCE` ou `ADMIN` podem alterar o status ou adicionar notas de resolução. O `USER` tem permissão apenas para criação e visualização (se implementado).

---

## 5. Auditoria (Efeito Colateral)

Ações que alteram o estado do sistema geram logs automáticos:
-   `CREATE_BOOKING`, `CANCEL_BOOKING`.
-   `CREATE_BLACKOUT`, `CREATE_DATE_RANGE_BLACKOUT`.
-   `CREATE_ISSUE_REPORT`, `UPDATE_ISSUE_REPORT`.
-   Operações administrativas (CRUD de usuários, salas, feriados).

---

## 6. Erros de Autorização

-   **401 Unauthorized**: Retornado quando um usuário tenta realizar uma ação fora de seu papel ou escopo (ex: cancelar reserva de outro usuário sem ser ADMIN).
-   **403 Forbidden**: Retornado por rotas protegidas quando o papel do usuário não consta na lista de permissões da rota.