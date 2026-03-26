#!/bin/bash
set -e

SKILL_DIR="$HOME/.claude/skills/user/slack-monitoring"
COMMAND_DIR="$HOME/.claude/commands"
DATA_DIR="$HOME/.claude/slack-monitoring"

echo "=== Slack Monitoring for Claude Code ==="
echo ""

# Install skill
echo "[1/3] Installing skill..."
mkdir -p "$SKILL_DIR"
cp skill/SKILL.md "$SKILL_DIR/SKILL.md"
echo "  -> $SKILL_DIR/SKILL.md"

# Install command
echo "[2/3] Installing command..."
mkdir -p "$COMMAND_DIR"
cp command/slack-monitoring.md "$COMMAND_DIR/slack-monitoring.md"
echo "  -> $COMMAND_DIR/slack-monitoring.md"

# Create data directory
echo "[3/3] Creating data directory..."
mkdir -p "$DATA_DIR"
echo "  -> $DATA_DIR/"

echo ""
echo "Done! Run '/slack-monitoring setup' in Claude Code to configure."
