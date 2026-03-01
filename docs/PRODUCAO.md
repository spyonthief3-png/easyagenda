# EasyAgenda - Deploy Produção (Vercel + Turso)

## 🎯 Visão Geral

```
┌─────────────┐       ┌─────────────┐
│   Vercel    │       │   Turso     │
│  Frontend   │──────▶│  (libSQL)   │
│  + Backend  │       │  SQLite     │
└─────────────┘       └─────────────┘
```

---

## 📋 Checklist Pré-Deploy

- [x] Segurança (bcrypt, JWT)
- [x] Rate limiting
- [x] Validação inputs (Zod)
- [x] CORS configurável
- [x] Health check (/health)
- [x] Variáveis ambiente
- [x] Cliente DB Turso

---

## 🚀 Passo a Passo

### 1. Criar Banco Turso

```bash
# Instalar CLI Turso
curl -sL https://get.tur.so/install.sh | bash

# Autenticar
turso auth login

# Criar banco
turso db create easyagenda

# Obter URL do banco
turso db show easyagenda --url
# Saída: libsql://easyagenda-xxxx.turso.cloud

# Criar token de acesso
turso db tokens create easyagenda
# Saída: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Configurar Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (siga as instruções)
vercel --prod
```

### 3. Variáveis de Ambiente (Vercel Dashboard)

**Frontend (Environment Variables):**
| Variável | Valor |
|----------|-------|
| `VITE_API_URL` | `https://seu-projeto.vercel.app` |

**Backend (Environment Variables):**
| Variável | Valor |
|----------|-------|
| `JWT_SECRET` | `openssl rand -hex 32` |
| `NODE_ENV` | `production` |
| `ALLOWED_ORIGINS` | `https://seu-projeto.vercel.app` |
| `TURSO_DATABASE_URL` | `libsql://easyagenda-xxxx.turso.cloud` |
| `TURSO_AUTH_TOKEN` | `eyJhbGciOiJIUzI1NiIs...` |

### 4. Executar Migrations

```bash
# Gerar SQL de migração
npx drizzle-kit generate

# Aplicar migração no Turso
# (empor volta ao SQLite local primeiro)
npx drizzle-kit push
```

### 5. Seed do Banco

```bash
# Conectar ao Turso localmente para seed
turso db shell easyagenda

# Ou usar o script de seed modificado para Turso
TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npx tsx server/db/seed.ts
```

---

## 📁 Arquivos de Configuração

| Arquivo | Descrição |
|---------|-----------|
| `vercel.json` | Rotas e builds Vercel |
| `api/index.ts` | Entry point serverless |
| `.env.example` | Template variáveis ambiente |
| `server/db/client.ts` | Cliente SQLite/Turso |

---

## 🔧 Comandos Úteis

```bash
# Desenvolvimento local
npm run dev:full

# Build produção
npm run build

# Preview produção
npm run preview

# Ver logs Vercel
vercel logs seu-projeto

# Abrir shell Turso
turso db shell easyagenda
```

---

## ⚠️ Problemas Comuns

### CORS
Se tiver erros de CORS, verifique:
1. `ALLOWED_ORIGINS` está configurado corretamente
2. Não há espaços extras entre domínios

### Banco não conecta
1. Verificar `TURSO_DATABASE_URL` está correto
2. Token `TURSO_AUTH_TOKEN` está válido
3. Executar `turso db show easyagenda` para verificar status

### 404 em API
Verificar que `vercel.json` está com rotas corretas pointing to `api/index.ts`

---

## 📝 Registro de Alterações

### v1.0.0 - Sprint 1
- Hash de senhas (bcrypt)
- Validação de inputs (Zod)
- Rate limiting
- CORS configurável
- Health check
- Suporte Turso
- Config Vercel
