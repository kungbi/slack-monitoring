[English](README.md) | [한국어](README.ko.md) | [中文](README.zh.md) | [日本語](README.ja.md) | Español | [Tiếng Việt](README.vi.md) | [Português](README.pt.md)

# slack-monitoring

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Skill-blueviolet)](https://docs.anthropic.com/en/docs/claude-code)
[![Slack MCP](https://img.shields.io/badge/Slack-MCP_Server-4A154B?logo=slack&logoColor=white)](https://modelcontextprotocol.io/integrations/slack)

**Monitoreo de menciones de Slack para Claude Code. Nunca más pierdas una @mención.**

_Deja de revisar Slack manualmente. Deja que Claude lo vigile por ti._

[Inicio Rápido](#inicio-rápido) • [Comandos](#comandos) • [Cómo Funciona](#cómo-funciona) • [Configuración](#configuración)

---

## Inicio Rápido

**Paso 1: Instalar**

```bash
# Opción A: Plugin Marketplace (Recomendado)
/plugin marketplace add https://github.com/kungbi/slack-monitoring.git
/plugin install slack-monitoring

# Opción B: Instalación manual
git clone https://github.com/kungbi/slack-monitoring.git
cd slack-monitoring && chmod +x install.sh && ./install.sh
```

**Paso 2: Configurar**

```
/slack-monitoring:setup
```

**Paso 3: Iniciar monitoreo**

```
/slack-monitoring:start
```

Eso es todo. Claude revisa tus menciones cada 15 minutos y te envía un resumen.

---

## ¿Por qué slack-monitoring?

- **Cero overhead** — Configura y olvídate. Se ejecuta en segundo plano mientras programas
- **Reconocimiento de hilos** — Rastrea cada mención como hilo, no como mensaje individual
- **Auto-completado** — ¿Ya respondiste? Marcado automáticamente como completado
- **Resúmenes contextuales** — Contexto completo del hilo + respuestas sugeridas
- **Notificaciones inteligentes** — Solo alerta sobre nuevas menciones. Sin ruido duplicado
- **Filtrado de canales** — Ignora canales ruidosos, prioriza los críticos, configura remitentes VIP
- **Resumen semanal** — Tasa de respuesta, tiempo promedio, canales y remitentes principales
- **Personalizable** — Idioma, tono, intervalo, estilo de resumen — todo configurable

---

## Comandos

| Comando | Función |
|---------|---------|
| `/slack-monitoring:start` | Iniciar monitoreo (intervalo de 15m por defecto) |
| `/slack-monitoring:start 5m` | Iniciar con intervalo personalizado |
| `/slack-monitoring:list` | Mostrar menciones pendientes |
| `/slack-monitoring:show 1` | Ver detalles de mención #1 (resumen, respuesta sugerida) |
| `/slack-monitoring:complete 2` | Marcar mención #2 como completada |
| `/slack-monitoring:complete all` | Marcar todas las pendientes como completadas |
| `/slack-monitoring:digest` | Resumen semanal (últimos 7 días) |
| `/slack-monitoring:setup` | Asistente de configuración |
| `/slack-monitoring:help` | Mostrar ayuda |
| `/slack-monitoring:status` | Mostrar configuración y estadísticas de menciones del día |

---

## Cómo Funciona

```
Cada ciclo de verificación:

  ┌─────────────────────────────────────────────────┐
  │  1. Buscar @menciones de hoy en Slack           │
  │  2. Aplicar filtros de canal (ignorar/priorizar)│
  │  3. Para cada nueva mención:                    │
  │     → Leer hilo completo                        │
  │     → ¿Ya respondió? → auto_completed           │
  │     → ¿Sin respuesta? → pending + alerta        │
  │     → ¿VIP/canal prioritario? → marcado 🔴      │
  │  4. Re-verificar hilos pending existentes       │
  │     → ¿Respuesta encontrada? → auto_completed   │
  │  5. Guardar registro diario                     │
  └─────────────────────────────────────────────────┘
```

### Tipos de Estado

| Estado | Descripción |
|--------|-------------|
| `pending` | Sin respuesta — necesita tu atención |
| `auto_completed` | Respondiste en el hilo — auto-resuelto |
| `completed` | Marcado manualmente con el comando `complete` |

---

## Resumen Semanal

Ejecuta `/slack-monitoring:digest` para un resumen de 7 días:

```
📊 Weekly Digest (03/18 ~ 03/24)

📈 Resumen
- Total menciones: 28
- Respondidas: 25 (89%)
- Auto-completadas: 18 / Manuales: 7
- Pendientes: 3

⏱️ Tiempo de Respuesta
- Promedio: 1h 23m
- Más rápido: 5m (#incidents)
- Más lento: 6h (#general)
```

---

## Configuración

Ejecuta `/slack-monitoring:setup` para configurar:

| Ajuste | Opciones | Por defecto |
|--------|----------|-------------|
| **Conexión Slack** | Auto-detectada | — |
| **Idioma** | Coreano, Inglés | Coreano |
| **Tono** | Formal, Casual, Aprender de tus mensajes | Formal |
| **Intervalo** | 1m, 5m, 10m, 15m, 30m, 1h, personalizado | 15m |
| **Estilo de resumen** | Breve, Detallado, Contexto completo | Detallado |
| **Canales ignorados** | Canales a omitir | Ninguno |
| **Canales prioritarios** | Canales mostrados primero | Ninguno |
| **Remitentes VIP** | Personas siempre con alta prioridad | Ninguno |

---

## Requisitos

| Requisito | Descripción |
|-----------|-------------|
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | Herramienta CLI (sesión activa requerida) |
| Token de usuario de Slack | Token `xoxp-` con los scopes requeridos (el asistente de configuración te guía) |

### Scopes requeridos del token de Slack

| Scope | Propósito |
|-------|-----------|
| `search:read` | Buscar @menciones |
| `channels:history` | Leer hilos de canales públicos |
| `groups:history` | Leer hilos de canales privados |
| `im:history` | Leer hilos de mensajes directos |
| `usergroups:read` | Detectar automáticamente tus grupos de Slack |
| `users:read` | Identificar tu perfil de usuario |

> **Cómo obtener un token:** Crea una app de Slack en [api.slack.com/apps](https://api.slack.com/apps), agrega los scopes anteriores en **OAuth & Permissions → User Token Scopes**, instálala en tu workspace y copia el **User OAuth Token** (comienza con `xoxp-`). Ejecuta `/slack-monitoring:setup` y pégalo cuando se te solicite.

> **Nota:** El monitoreo solo funciona mientras tu sesión de Claude Code esté activa. Cuando la sesión termina, el monitoreo también se detiene.

---

## License

MIT — ver [LICENSE](LICENSE) para detalles.

---

<div align="center">

**Deja de cambiar de contexto. Enfócate en programar.**

</div>
