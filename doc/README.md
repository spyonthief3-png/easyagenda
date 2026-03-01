# EasyAgenda - Documentação Técnica (v1.1.0)

O **EasyAgenda** é uma solução Single Page Application (SPA) para gestão e reserva de espaços físicos em ambientes que operam sob o modelo de **períodos fixos** (educacional ou corporativo).

---

## 1. Visão do Produto

### 1.1 Objetivo
Eliminar conflitos de agenda e otimizar a ocupação de salas de aula e auditórios através de uma interface visual intuitiva, garantindo que usuários encontrem espaços disponíveis e administradores tenham controle total sobre o patrimônio.

### 1.2 Casos de Uso
- **Agendamento Visual**: Consultar disponibilidade em grade horária e reservar em 2 cliques.
- **Busca por Slot**: Encontrar a primeira sala livre em um horário específico.
- **Gestão de Crise**: Reportar problemas técnicos e bloquear salas para manutenção imediata.
- **Auditoria**: Rastrear quem agendou ou cancelou cada recurso para governança.

### 1.3 Perfis de Usuário
- **USER**: Focado em produtividade pessoal (reservar e consultar).
- **MAINTENANCE**: Focado na integridade física (bloquear para reparos e resolver chamados).
- **ADMIN**: Focado em governança e configuração (gestão de usuários, salas e relatórios).

---

## 5. RBAC: Matriz de Permissões

| Ação / Rota | USER | MAINTENANCE | ADMIN |
| :--- | :---: | :---: | :---: |
| Visualizar Grade / Mês | ✅ | ✅ | ✅ |
| Criar/Cancelar Própria Reserva | ✅ | ✅ | ✅ |
| Reportar Problema em Sala | ✅ | ✅ | ✅ |
| Gerenciar Chamados (Status) | ❌ | ✅ | ✅ |
| Bloquear Sala (Data Range) | ❌ | ✅ | ✅ |
| Gerenciar Salas/Usuários | ❌ | ❌ | ✅ |
| Visualizar Auditoria/Logs | ❌ | ❌ | ✅ |
| Cancelar Reserva de Terceiros | ❌ | ❌ | ✅ |

---

## 6. Lógica de Calendário: Precedência de Status

O status de um slot é determinado de forma determinística seguindo esta ordem de vitória:
1. **CLOSED**: Se `dia == Domingo` (Vence tudo).
2. **HOLIDAY**: Se `data` consta em `mockHolidays`.
3. **BLACKOUT**: Se há bloqueio específico (sala/período) em `mockBlackouts`.
4. **MY_BOOKING**: Se há reserva do `currentUserId`.
5. **BOOKED**: Se há reserva de outro usuário.
6. **AVAILABLE**: Se nenhuma das condições acima for atendida.

---

## 7. Contrato de Dados (Entidades)

### 7.1 Booking (Reserva)
```json
{
  "id": "uuid-string",
  "room": { "id": "r1", "name": "Auditório" },
  "user": { "id": "u1", "name": "Fulano" },
  "date": "2025-05-20",
  "period": { "id": 1, "code": "M1" },
  "status": "CONFIRMED"
}
```

### 7.2 Audit Log
```json
{
  "id": 123,
  "actor": { "id": "u2", "name": "Admin" },
  "action": "CREATE_BOOKING",
  "entity": "booking",
  "entityId": "target-id",
  "createdAt": "2025-05-20T10:00:00Z"
}
```

---

## 11. Estratégia de Migração (Roadmap)

Para substituir o Mock por um backend real:
1. **Service Layer**: Alterar `services/api.ts` para usar `fetch` ou `axios` apontando para endpoints REST.
2. **DTOs**: Validar se os tipos em `types.ts` coincidem com o schema do banco.
3. **Auth**: Substituir a persistência do `AuthContext` de `user` puro para um `access_token` JWT.
4. **Audit**: O backend deve assumir a responsabilidade de gerar logs em cada transação, removendo o `addAuditLog` manual do frontend.
