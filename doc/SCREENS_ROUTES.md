# Mapa de Telas e Rotas (v1.1.0)

Este documento conecta a estrutura de navegação (`App.tsx`) com as regras de permissão, interações de dados e comportamentos de sistema.

---

## 1. Regras de Proteção de Rotas (Guards)

O componente `ProtectedRoute` aplica as seguintes regras de navegação:

- **Não Autenticado**: Qualquer tentativa de acessar rotas protegidas redireciona para `/login`, preservando a rota pretendida no estado (`location.state.from`).
- **Autenticado (Role Inválida)**: Se o papel do usuário não estiver na lista permitida da rota, o sistema redireciona para a Home (`/`).
- **Página Não Encontrada (404)**: Qualquer rota não mapeada explicitamente (`*`) redireciona o usuário para a Home (`/`). Esta é uma decisão de produto para simplificar a navegação.
- **Redirecionamento Pós-Login**: Após o login bem-sucedido, o usuário é levado para a rota salva em `from` ou para a Home.

---

## 2. Área Pública e Sistema

| Rota | Componente | Papéis | Comportamento |
| :--- | :--- | :---: | :--- |
| `/login` | `LoginPage` | Livre | Autenticação. Se já logado, redireciona para `/`. |
| `*` | N/A | ALL | **Redirecionamento global para `/`**. |

---

## 3. Área do Usuário (Base)
*Papéis: USER, MAINTENANCE, ADMIN*

| Rota | Componente | APIs Principais | APIs Auxiliares (Dropdowns) |
| :--- | :--- | :--- | :--- |
| `/` | `HomePage` | `getCalendarAvailability`, `createBooking` | `getRooms`, `getLocations`, `getRoomTypes` |
| `/find-slot` | `FindSlotPage` | `getCalendarAvailability`, `createBooking` | `getRooms`, `getLocations`, `getRoomTypes` |
| `/my-bookings`| `MyBookingsPage` | `getMyBookings`, `cancelBooking` | `getLocations`, `getRoomTypes` |
| `/profile` | `ProfilePage` | `updateUser`, `changePassword` | N/A |

---

## 4. Área de Manutenção
*Papéis: MAINTENANCE, ADMIN*

| Rota | Componente | APIs Principais | Params / Filtros |
| :--- | :--- | :--- | :--- |
| `/maintenance/issues` | `MaintenanceIssuesPage` | `getIssueReports`, `updateIssueReport` | `status` (OPEN, IN_PROGRESS, RESOLVED) |
| `/maintenance/blocks` | `MaintenanceBlockPage` | `getBlackouts`, `createDateRangeBlackout`, `deleteDateRangeBlackout` | N/A |

---

## 5. Área Administrativa (ADMIN)
*Papel: ADMIN*

| Rota | Componente | APIs Principais | Notas de UI |
| :--- | :--- | :--- | :--- |
| `/admin` | `AdminDashboardPage` | N/A | Menu de atalhos para todas as sub-rotas. |
| `/admin/users` | `ManageUsersPage` | `getUsers`, `createUser`, `updateUser`, `deleteUser` | CRUD Tabular. |
| `/admin/rooms` | `ManageRoomsPage` | `getRooms`, `createRoom`, `updateRoom`, `deleteRoom` | Requer `getLocations`, `getRoomTypes`. |
| `/admin/locations`| `ManageLocationsPage` | `getLocations`, `createLocation`, `deleteLocation` | Bloqueio de delete se em uso. |
| `/admin/room-types`| `ManageRoomTypesPage` | `getRoomTypes`, `createRoomType`, `deleteRoomType` | Bloqueio de delete se em uso. |
| `/admin/bookings`| `ManageBookingsPage` | `getAllBookings`, `cancelBooking` | Visão global de todas as reservas. |
| `/admin/holidays-blackouts` | `ManageHolidaysPage` & `ManageBlackoutsPage` | `createHoliday`, `deleteHoliday`, `createBlackout`, `deleteBlackout` | Tela composta (Feriados e Bloqueios). |
| `/admin/reports`| `AdminReportsPage` | `getDashboardStats` | Filtros: `startDate`, `endDate`, `locationId`. |
| `/admin/audit-logs`| `AuditLogPage` | `getAuditLogs` | Ordenação cronológica invertida. |

---

## 6. Ações Globais e Modais (Sem Rota Própria)

- **Reportar Problema**: Acionado via Modal (`ReportIssueModal`). API: `createIssueReport`.
- **Confirmação de Reserva**: Acionado via Modal (`BookingModal`). API: `createBooking`.
- **Atualização de Chamado**: Acionado via Modal (`UpdateIssueModal`). API: `updateIssueReport`.