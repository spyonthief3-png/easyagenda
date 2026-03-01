# Regras de Negócio (v1.1.0)

Este documento define as regras funcionais e restrições do domínio do EasyAgenda. Ele é a fonte de verdade para implementação, QA e migração do mock para um backend real.

---

## 1. Conceitos e Definições

### 1.1 Períodos Fixos
O dia é dividido em 6 períodos fixos:
- **Manhã**: M1, M2
- **Tarde**: T1, T2
- **Noite**: N1, N2
Um slot é a combinação única de `{date}` + `{periodCode}`.

### 1.2 Identidade de Reserva (Chave Única)
Uma reserva é única no sistema pela chave composta:
`{roomId}` + `{date}` + `{periodCode}`.

### 1.3 Formato de Data e Timezone
- Datas são sempre tratadas como strings no formato `YYYY-MM-DD` (zero-padded).
- "Hoje" e comparações de data são calculadas no fuso local do navegador (America/Sao_Paulo).

---

## 2. Perfis e Permissões (Resumo de RBAC)

- **USER**: Criar/cancelar apenas suas reservas; consultar disponibilidade; reportar problemas.
- **MAINTENANCE**: Tudo do USER + criar bloqueios (blackouts) e bloqueios por intervalo (manutenção); gerenciar chamados (alterar status).
- **ADMIN**: Tudo do MAINTENANCE + cancelar reservas de terceiros; gerenciar salas, locais, tipos e usuários; acessar auditoria total.

---

## 3. Regras de Agendamento (Bookings)

### 3.1 Condições para Criar Reserva
Para criar uma reserva, todas as condições abaixo devem ser satisfeitas:
1. **Validação Temporal**: A data da reserva não pode ser inferior à data atual (hoje).
2. **Sala Ativa**: A sala deve estar com `isActive = true`.
3. **Disponibilidade da Sala**: Não pode existir reserva ativa para o mesmo `{roomId, date, periodCode}`.
4. **Conflito de Usuário**: O usuário não pode ter outra reserva ativa no mesmo `{date, periodCode}` (mesmo que em outra sala).
5. **Restrições Globais**: O slot não pode estar em estado `CLOSED`, `HOLIDAY` ou `BLACKOUT`.

### 3.2 Resultado Esperado
- Status inicial: `CONFIRMED`.
- Registro de auditoria: `CREATE_BOOKING`.

---

## 4. Regras de Cancelamento

### 4.1 Autorização
- **Dono**: Pode cancelar suas próprias reservas a qualquer momento.
- **Admin**: Pode cancelar qualquer reserva (exige registro de log).

### 4.2 Efeitos
- O status da reserva muda para `CANCELLED`.
- O slot torna-se imediatamente `AVAILABLE` (se não houver blackout/feriado).
- Registro de auditoria: `CANCEL_BOOKING`.

---

## 5. Regras de Disponibilidade (SlotStatus)

### 5.1 Precedência de Status
O status de um slot é determinado seguindo esta ordem de prioridade:
1. **CLOSED**: Se o dia for domingo.
2. **HOLIDAY**: Se a data for um feriado cadastrado.
3. **BLACKOUT**: Se houver bloqueio específico (sala/período) ou global.
4. **MY_BOOKING**: Se houver reserva confirmada do usuário logado.
5. **BOOKED**: Se houver reserva confirmada de outro usuário.
6. **AVAILABLE**: Se nenhuma condição acima for atendida.

---

## 6. Manutenção e Problemas (Issue Reports)

### 6.1 Fluxo de Chamados
- **Criação**: Qualquer usuário autenticado pode criar um chamado (`ABERTO`).
- **Resolução**: Apenas `MAINTENANCE` ou `ADMIN` podem transitar para `EM ANDAMENTO` ou `RESOLVIDO`.
- **Obrigatoriedade**: Ao marcar como `RESOLVIDO`, o campo `resolutionNotes` torna-se obrigatório.

---

## 7. Políticas de Erros Funcionais

- **409 Conflict**: Conflito de agenda (sala ocupada ou usuário já ocupado).
- **401 Unauthorized**: Tentativa de ação sem permissão (ex: cancelar reserva alheia).
- **400 Bad Request**: Data no passado, campos obrigatórios ausentes ou formato inválido.

---

## 8. Decisões de Casos de Borda (v1.1.0)
- **Reservas Passadas**: Bloqueadas. O sistema não permite agendar retroativamente.
- **Blackout sobre Reserva**: Ao criar um blackout em horário já reservado, a reserva existente deve ser cancelada manualmente pelo Admin ou o blackout deve aguardar a liberação. (Padrão v1: Blackout tem soberania visual na grade).
- **Domingos**: Bloqueio total (CLOSED), exceto para consultas de histórico.