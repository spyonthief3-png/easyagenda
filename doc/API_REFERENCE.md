# Referência da API Mock (v1.1.0)

**Última Atualização**: 2025-05-20
**Status**: Compatível com Documentação Técnica v1.1.0

Este documento define os contratos de interface da camada de serviço (`services/api.ts`). O sistema utiliza o padrão **camelCase** para todas as chaves de objetos e parâmetros.

---

## 1. Visão Geral e Convenções

- **Protocolo**: Todas as chamadas são assíncronas (`Promise<T>`).
- **Persistência**: 
    - **Dados**: Em memória (volátil).
    - **Sessão**: Persistida em `localStorage`.
- **Formato de Data**: Rigorosamente `YYYY-MM-DD`. **Importante**: Datas devem conter zero-padding (ex: `2025-01-08`).

---

## 2. Definições de Tipos (Contracts)

### 2.1 Disponibilidade
```typescript
type SlotStatus = 'AVAILABLE' | 'BOOKED' | 'MY_BOOKING' | 'BLACKOUT' | 'HOLIDAY' | 'CLOSED';

interface AvailabilitySlot {
  status: SlotStatus;
  /** Presente apenas se status for BOOKED ou MY_BOOKING */
  booking?: { id: string; title: string; user: { name: string } };
  /** Presente apenas se status for BLACKOUT */
  blackout?: { reason: string; blockId?: string };
  /** Presente apenas se status for HOLIDAY */
  holiday?: { name: string };
}

/** 
 * DayAvailability: Mapa de salas para períodos.
 * [roomId][periodCode] -> AvailabilitySlot
 */
type DayAvailability = Record<string, Record<string, AvailabilitySlot>>;
```

### 2.2 Auditoria
```typescript
type AuditAction = 
    | 'CREATE_BOOKING' | 'CANCEL_BOOKING' 
    | 'CREATE_ROOM' | 'UPDATE_ROOM' | 'DELETE_ROOM' 
    | 'CREATE_LOCATION' | 'UPDATE_LOCATION' | 'DELETE_LOCATION' 
    | 'CREATE_ROOM_TYPE' | 'UPDATE_ROOM_TYPE' | 'DELETE_ROOM_TYPE' 
    | 'CREATE_USER' | 'UPDATE_USER' | 'DELETE_USER' 
    | 'CHANGE_PASSWORD' | 'CREATE_HOLIDAY' | 'DELETE_HOLIDAY' 
    | 'CREATE_BLACKOUT' | 'DELETE_BLACKOUT' 
    | 'CREATE_DATE_RANGE_BLACKOUT' | 'DELETE_DATE_RANGE_BLACKOUT' 
    | 'CREATE_ISSUE_REPORT' | 'UPDATE_ISSUE_REPORT';

interface AuditLog {
  id: number;
  actor: { id: string; name: string };
  action: AuditAction;
  entity: 'booking' | 'room' | 'user' | 'location' | 'roomType' | 'holiday' | 'blackout' | 'issueReport';
  entityId: string;
  createdAt: string; // ISO 8601
}
```

---

## 3. Contratos de DTO (Input)

| Nome | Estrutura |
| :--- | :--- |
| **CreateBookingDTO** | `{ roomId, userId, date: string, periodCode, title, notes? }` |
| **UpdateRoomDTO** | `{ name?, locationId?, roomTypeId?, capacity?, resources?, isActive? }` |
| **CreateBlackoutDTO** | `{ date: string, reason, roomId?, periodCode? }` |
| **IssueReportDTO** | `{ roomId, category, description, patrimonyNumber?, photoUrl? }` |

---

## 4. Referência de Métodos

### 4.1 Módulo: Reservas (Bookings)

#### `getCalendarAvailability`
- **Assinatura**: `(date: string, userId: string) => Promise<DayAvailability>`
- **Comportamento**: AVAILABLE/CLOSED: campos de metadados não são retornados.

#### `createBooking`
- **Assinatura**: `(details: CreateBookingDTO) => Promise<Booking>`
- **Audit**: `CREATE_BOOKING`

#### `cancelBooking`
- **Assinatura**: `(id: string, userId: string, reason: string) => Promise<void>`
- **Regra**: Lança `401` se o ator não for o dono ou `ADMIN`.
- **Audit**: `CANCEL_BOOKING`

---

### 4.2 Módulo: Infraestrutura e Manutenção

#### `updateRoom`
- **Assinatura**: `(id: string, data: UpdateRoomDTO, actorId: string) => Promise<Room>`
- **Audit**: `UPDATE_ROOM`

#### `updateIssueReport`
- **Assinatura**: `(id: string, data: { status, resolutionNotes? }, actorId: string) => Promise<IssueReport>`
- **Valid**: `resolutionNotes` obrigatório para status `RESOLVIDO`.
- **Audit**: `UPDATE_ISSUE_REPORT`

---

### 4.3 Módulo: Bloqueios e Feriados

#### `createDateRangeBlackout`
- **Assinatura**: `(details: { startDate, endDate, roomId, reason }, actorId: string) => Promise<void>`
- **Nota**: Gera um `blockId` compartilhado para agrupar o intervalo.
- **Audit**: `CREATE_DATE_RANGE_BLACKOUT`

---

## 5. Tratamento de Erros por Método

| Método | 400 (Bad Request) | 401 (Unauthorized) | 404 (Not Found) | 409 (Conflict) |
| :--- | :---: | :---: | :---: | :---: |
| `createBooking` | ✅ | ❌ | ✅ | ✅ |
| `cancelBooking` | ❌ | ✅ | ✅ | ❌ |
| `updateRoom` | ✅ | ❌ | ✅ | ❌ |
| `createHoliday` | ✅ | ❌ | ❌ | ✅ |
| `updateIssueReport`| ✅ | ❌ | ✅ | ❌ |

---

## 6. Mapa de Auditoria (Efeitos Colaterais)

| Ação de Auditoria | Disparada por | Entidade |
| :--- | :--- | :--- |
| `CREATE_BOOKING` | `createBooking` | `booking` |
| `CANCEL_BOOKING` | `cancelBooking` | `booking` |
| `UPDATE_ROOM` | `updateRoom` | `room` |
| `CHANGE_PASSWORD` | `changePassword` | `user` |
| `CREATE_ISSUE_REPORT` | `createIssueReport` | `issueReport` |
