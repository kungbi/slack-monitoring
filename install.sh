#!/bin/bash
set -e

DATA_DIR="$HOME/.claude/slack-monitoring"
SCRIPTS_DIR="$DATA_DIR/scripts"
COMMANDS_DIR="$HOME/.claude/commands"

echo "=== Slack Monitoring for Claude Code ==="
echo ""

# Install commands
echo "[1/3] Installing commands..."
mkdir -p "$COMMANDS_DIR"
cp commands/*.md "$COMMANDS_DIR/"
echo "  -> $COMMANDS_DIR/ ($(ls commands/*.md | wc -l | tr -d ' ') commands)"

# Install monitor script
echo "[2/3] Installing monitor script..."
mkdir -p "$SCRIPTS_DIR"
cp scripts/monitor.js "$SCRIPTS_DIR/"
echo "  -> $SCRIPTS_DIR/monitor.js"

# Create data directory
echo "[3/3] Creating data directory..."
mkdir -p "$DATA_DIR"
echo "  -> $DATA_DIR/"

echo ""
echo "Done! Run '/slack-monitoring:setup' in Claude Code to configure."
