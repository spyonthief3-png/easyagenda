# Validações e Mensagens de Erro (v1.1.0)

Este documento padroniza a comunicação de falhas e as regras de validação do sistema, garantindo consistência entre a UI, a camada de serviço (Mock) e o futuro backend.

---

## 1. Definições de Status HTTP (Simulados)

| Código | Nome | Contexto de Uso |
| :--- | :--- | :--- |
| **400** | Bad Request | Erro de formato, campos obrigatórios ausentes ou lógica de data inválida. |
| **401** | Unauthorized | Usuário não autenticado (sessão expirada ou ausente). |
| **403** | Forbidden | Usuário autenticado, mas sem papel (Role) ou posse (Ownership) necessária. |
| **404** | Not Found | Recurso (Sala, Usuário, Reserva) não encontrado via ID. |
| **409** | Conflict | Violação de regra de negócio (Colisão de agenda, duplicidade de chave única). |

---

## 2. Estrutura de Resposta de Erro (Contrato)

Embora o mock atual utilize `throw new Error(message)`, a UI deve estar preparada para o seguinte formato de objeto:

```typescript
interface ApiError {
  code: number;      // Código HTTP
  message: string;   // Mensagem amigável para o usuário
  field?: string;    // (Opcional) Nome do campo que gerou o erro
}
```

---

## 3. Validações por Módulo

### 3.1 Módulo: Reservas (Bookings)
- **Título Ausente**: "O título da reserva é obrigatório." (400)
- **Data Passada**: "Não é possível realizar reservas para datas passadas." (400)
- **Sala Ocupada**: "Esta sala já está reservada para este período." (409)
- **Usuário Ocupado**: "Você já possui uma reserva neste período." (409)
- **Slot Bloqueado**: "O horário selecionado não permite reservas (Feriado/Bloqueio)." (409)
- **Dono Inválido**: "Você não tem permissão para cancelar uma reserva que não é sua." (403)

### 3.2 Módulo: Manutenção (Maintenance)
- **Intervalo Inválido**: "A data de início não pode ser posterior à data de término." (400)
- **Notas de Resolução**: "Notas são obrigatórias ao resolver um chamado." (400)
- **Acesso Negado**: "Apenas a equipe de manutenção ou administradores podem atualizar chamados." (403)

### 3.3 Módulo: Administração (Admin)
- **Integridade (Local)**: "Não é possível excluir uma localização que possui salas vinculadas." (409)
- **Integridade (Tipo)**: "Não é possível excluir um tipo de sala que possui salas vinculadas." (409)
- **Duplicidade (User)**: "Nome de usuário ou e-mail já cadastrado." (409)
- **Auto-Exclusão**: "Não é permitido excluir sua própria conta administrativa." (403)
- **Feriado Duplicado**: "Já existe um feriado cadastrado para esta data." (409)

---

## 4. Matriz de Erros por Ação

| Ação | 400 | 401 | 403 | 404 | 409 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `createBooking` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `cancelBooking` | ❌ | ✅ | ✅ | ✅ | ❌ |
| `createDateRangeBlackout` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `updateIssueReport` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `deleteLocation / Type` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `createUser` | ✅ | ✅ | ✅ | ❌ | ✅ |

---

## 5. Diretrizes de UX e Feedback

1.  **Feedback de Sucesso**: Exibir Toasts verdes para ações que persistem dados (`Salvo com sucesso`, `Reserva confirmada`).
2.  **Estados de Carregamento**:
    -   Botões devem entrar em estado `disabled` e exibir um spinner durante o processamento.
    -   Tabelas devem exibir um esqueleto (skeleton) ou spinner centralizado.
3.  **Estados Vazios**: Quando filtros resultarem em zero itens, exibir: "Nenhum registro encontrado para os filtros aplicados."
4.  **Tratamento de Erros Globais**: Se a API falhar inesperadamente, exibir: "Ocorreu um erro inesperado. Por favor, tente novamente em instantes."