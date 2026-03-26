[English](README.md) | [한국어](README.ko.md) | [中文](README.zh.md) | [日本語](README.ja.md) | [Español](README.es.md) | [Tiếng Việt](README.vi.md) | Português

# slack-monitoring

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Skill-blueviolet)](https://docs.anthropic.com/en/docs/claude-code)
[![Slack MCP](https://img.shields.io/badge/Slack-MCP_Server-4A154B?logo=slack&logoColor=white)](https://modelcontextprotocol.io/integrations/slack)

**Monitoramento de menções do Slack para Claude Code. Nunca mais perca uma @menção.**

_Pare de verificar o Slack manualmente. Deixe o Claude vigiar para você._

[Início Rápido](#início-rápido) • [Comandos](#comandos) • [Como Funciona](#como-funciona) • [Configuração](#configuração)

---

## Início Rápido

**Passo 1: Instalar**

```bash
# Opção A: Plugin Marketplace (Recomendado)
/plugin marketplace add https://github.com/kungbi/slack-monitoring
/plugin install slack-monitoring

# Opção B: Instalação manual
git clone https://github.com/kungbi/slack-monitoring.git
cd slack-monitoring && chmod +x install.sh && ./install.sh
```

**Passo 2: Configurar**

```
/slack-monitoring setup
```

**Passo 3: Iniciar monitoramento**

```
/slack-monitoring
```

É isso. O Claude verifica suas menções a cada 15 minutos e envia um resumo.

---

## Por que slack-monitoring?

- **Zero overhead** — Configure e esqueça. Roda em segundo plano enquanto você programa
- **Reconhecimento de threads** — Rastreia cada menção como thread, não como mensagem individual
- **Auto-completar** — Já respondeu? Automaticamente marcado como concluído
- **Resumos contextuais** — Contexto completo da thread + respostas sugeridas
- **Notificações inteligentes** — Só alerta sobre novas menções. Sem ruído duplicado
- **Filtragem de canais** — Ignore canais barulhentos, priorize os críticos, configure remetentes VIP
- **Resumo semanal** — Taxa de resposta, tempo médio, top canais e remetentes
- **Personalizável** — Idioma, tom, intervalo, estilo de resumo — tudo configurável

---

## Comandos

| Comando | Função |
|---------|--------|
| `/slack-monitoring` | Iniciar monitoramento (intervalo padrão 15m) |
| `/slack-monitoring 5m` | Iniciar com intervalo personalizado |
| `/slack-monitoring list` | Mostrar menções pendentes |
| `/slack-monitoring complete 2` | Marcar menção #2 como concluída |
| `/slack-monitoring complete all` | Marcar todas as pendentes como concluídas |
| `/slack-monitoring digest` | Resumo semanal (últimos 7 dias) |
| `/slack-monitoring setup` | Assistente de configuração |
| `/slack-monitoring help` | Mostrar ajuda |

---

## Como Funciona

```
A cada ciclo de verificação:

  ┌─────────────────────────────────────────────────┐
  │  1. Buscar @menções de hoje no Slack            │
  │  2. Aplicar filtros de canal (ignorar/priorizar)│
  │  3. Para cada nova menção:                      │
  │     → Ler thread completa                       │
  │     → Já respondeu? → auto_completed            │
  │     → Sem resposta? → pending + alerta          │
  │     → VIP/canal prioritário? → marcado 🔴       │
  │  4. Re-verificar threads pending existentes     │
  │     → Resposta encontrada? → auto_completed     │
  │  5. Salvar registro diário                      │
  └─────────────────────────────────────────────────┘
```

### Tipos de Status

| Status | Descrição |
|--------|-----------|
| `pending` | Sem resposta — precisa da sua atenção |
| `auto_completed` | Você respondeu na thread — auto-resolvido |
| `completed` | Marcado manualmente com o comando `complete` |

---

## Resumo Semanal

Execute `/slack-monitoring digest` para um resumo de 7 dias:

```
📊 Weekly Digest (03/18 ~ 03/24)

📈 Visão Geral
- Total de menções: 28
- Respondidas: 25 (89%)
- Auto-completadas: 18 / Manuais: 7
- Pendentes: 3

⏱️ Tempo de Resposta
- Média: 1h 23m
- Mais rápido: 5m (#incidents)
- Mais lento: 6h (#general)
```

---

## Configuração

Execute `/slack-monitoring setup` para configurar:

| Configuração | Opções | Padrão |
|-------------|--------|--------|
| **Conexão Slack** | Auto-detectada | — |
| **Idioma** | Coreano, Inglês | Coreano |
| **Tom** | Formal, Casual, Aprender das suas mensagens | Formal |
| **Intervalo** | 1m, 5m, 10m, 15m, 30m, 1h, personalizado | 15m |
| **Estilo de resumo** | Breve, Detalhado, Contexto completo | Detalhado |
| **Canais ignorados** | Canais para pular | Nenhum |
| **Canais prioritários** | Canais mostrados primeiro | Nenhum |
| **Remetentes VIP** | Pessoas sempre com alta prioridade | Nenhum |

---

## Requisitos

| Requisito | Descrição |
|-----------|-----------|
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | Ferramenta CLI (sessão ativa necessária) |
| [Slack MCP Server](https://modelcontextprotocol.io/integrations/slack) | Integração Slack para Claude Code |

> **Nota:** O monitoramento funciona apenas enquanto sua sessão do Claude Code estiver ativa.

---

## License

MIT — veja [LICENSE](LICENSE) para detalhes.

---

<div align="center">

**Pare de trocar de contexto. Foque em programar.**

</div>
