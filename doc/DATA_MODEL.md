# Modelo de Dados (Domain Model) — v1.1.0

Este documento descreve as entidades do sistema, seus atributos, enums e relacionamentos, servindo como base para a camada de persistência e validações.

---

## 1. Entidades de Infraestrutura

### 1.1 Location (Bloco/Unidade)
- `id`: string (uuid)
- `name`: string (Ex: "BLOCO A")

### 1.2 RoomType (Categoria)
- `id`: string (uuid)
- `name`: string (Ex: "Laboratório")

### 1.3 Room (Sala)
- `id`: string (uuid)
- `name`: string
- `locationId`: FK (Location.id)
- `roomTypeId`: FK (RoomType.id)
- `capacity`: number
- `resources`: object (Ex: `{ projector: boolean, tv: boolean }`)
- `isActive`: boolean

### 1.4 Period (Período Fixo)
- `id`: number (1 a 6)
- `code`: string (M1, M2, T1, T2, N1, N2)
- `label`: string (Ex: "Manhã 1")
- `startTime`: string (HH:mm)
- `endTime`: string (HH:mm)

---

## 2. Entidades de Transação

### 2.1 Booking (Reserva)
- `id`: string (uuid)
- `roomId`: FK (Room.id)
- `userId`: FK (User.id)
- `date`: string (YYYY-MM-DD)
- `periodId`: FK (Period.id)
- `title`: string
- `notes`: text (opcional)
- `status`: Enum (CONFIRMED, CANCELLED)
- `createdAt`: ISO String

### 2.2 IssueReport (Chamado)
- `id`: string (uuid)
- `roomId`: FK (Room.id)
- `userId`: FK (User.id)
- `category`: Enum (CLEANING, EQUIPMENT, PATRIMONY, OTHER)
- `description`: text
- `status`: Enum (OPEN, IN_PROGRESS, RESOLVED)
- `resolutionNotes`: text (Obrigatório se status = RESOLVED)
- `createdAt`: ISO String
- `updatedAt`: ISO String
- `resolvedAt`: ISO String (opcional)

---

## 3. Entidades de Apoio e Auditoria

### 3.1 User (Usuário)
- `id`: string (uuid)
- `username`: string (Único)
- `name`: string
- `email`: string (Único)
- `role`: Enum (USER, MAINTENANCE, ADMIN)
- `isActive`: boolean

### 3.2 Holiday (Feriado Global)
- `id`: number/uuid
- `date`: string (YYYY-MM-DD)
- `name`: string

### 3.3 Blackout (Bloqueio)
- `id`: string (uuid)
- `date`: string (YYYY-MM-DD)
- `roomId`: FK (Room.id) (Opcional - null = Global)
- `periodId`: FK (Period.id) (Opcional - null = Dia Todo)
- `reason`: string
- `blockId`: string (Opcional - Usado para agrupar intervalos de manutenção)

### 3.4 AuditLog (Auditoria)
- `id`: number/uuid
- `actorId`: FK (User.id)
- `action`: Enum (AuditAction)
- `entity`: string (booking, room, user, etc)
- `entityId`: string
- `createdAt`: ISO String

---

## 4. Relacionamentos (Topologia)

```text
[Location] 1 --- N [Room]
[RoomType] 1 --- N [Room]
[Room]     1 --- N [Booking]
[Room]     1 --- N [IssueReport]
[Room]     1 --- N [Blackout] (se pontual)
[User]     1 --- N [Booking]
[User]     1 --- N [IssueReport]
[Period]   1 --- N [Booking]
[Period]   1 --- N [Blackout] (se pontual)
```

---

## 5. Constraints de Integridade

1.  **Unique Booking**: Uma sala não pode ter dois agendamentos `CONFIRMED` no mesmo `{date + periodId}`.
2.  **Unique User Agenda**: Um usuário não pode ter dois agendamentos `CONFIRMED` no mesmo `{date + periodId}`.
3.  **Unique Username**: O campo `User.username` é a chave de login e deve ser único.
4.  **Location Delete Restriction**: Não é possível excluir uma `Location` se houver `Room` vinculada a ela.
5.  **RoomType Delete Restriction**: Não é possível excluir um `RoomType` se houver `Room` vinculada a ele.
6.  **Holiday Unique Date**: Apenas um feriado cadastrado por data.

---

## 6. Notas de Implementação
- **periodCode vs periodId**: A UI e os DTOs utilizam `periodCode` (M1, T2) para legibilidade. O sistema de dados mapeia internamente para `periodId`.
- **Append-Only Logs**: Os registros de `AuditLog` nunca são deletados ou editados.
- **Exclusão Lógica**: Usuários e Salas utilizam `isActive` para desativação, mantendo integridade histórica de reservas passadas.