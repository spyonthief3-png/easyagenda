# EasyAgenda - Sistema de Agendamento de Salas

<div align="center">
<img width="1200" height="475" alt="EasyAgenda" src="./EasyAgenda.png" />
</div>

## 🚀 Quick Start

### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Rodar banco de dados (seed)
npx tsx server/db/seed.ts

# Rodar projeto completo (backend + frontend)
npm run dev:full
```

Acesse:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

### Credenciais (desenvolvimento)

| Email | Senha | Role |
|-------|-------|------|
| john@example.com | password123 | USER |
| jane@example.com | password123 | ADMIN |
| mike@example.com | password123 | MAINTENANCE |

---

## 🏭 Produção (Vercel + Turso)

Consulte `docs/PRODUCAO.md` para instruções detalhadas.

### Resumo

1. **Criar banco Turso:**
```bash
curl -sL https://get.tur.so/install.sh | bash
turso db create easyagenda
```

2. **Deploy no Vercel:**
```bash
npm i -g vercel
vercel --prod
```

3. **Configurar variáveis de ambiente** no dashboard do Vercel.

---

## 📁 Estrutura do Projeto

```
easyagenda/
├── api/                    # API Vercel (serverless)
├── components/              # Componentes React
├── contexts/               # React Contexts
├── dist/                   # Build produção
├── drizzle/                # Migrações Drizzle
├── hooks/                  # Custom hooks
├── pages/                  # Páginas React
├── server/
│   ├── db/
│   │   ├── client.ts      # Cliente DB (SQLite/Turso)
│   │   ├── schema.ts      # Schema Drizzle
│   │   └── seed.ts        # Seed do banco
│   ├── index.ts           # Servidor Express (dev)
│   └── validations.ts     # Schemas Zod
├── services/
│   └── api.ts             # Cliente API
├── types.ts               # Tipos TypeScript
├── vercel.json            # Config Vercel
└── vite.config.ts         # Config Vite
```

---

## 🛠️ Stack

- **Frontend:** React 19 + Vite + TypeScript
- **Backend:** Express.js + TypeScript
- **Database:** SQLite + Drizzle ORM
- **Produção:** Vercel + Turso (libSQL)
- **Validação:** Zod
- **Auth:** JWT + bcrypt

---

## 📄 Licença

MIT
