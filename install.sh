#!/bin/bash
set -e

SKILL_DIR="$HOME/.claude/skills/user/slack-monitoring"
DATA_DIR="$HOME/.claude/slack-monitoring"

echo "=== Slack Monitoring for Claude Code ==="
echo ""

# Install skills
echo "[1/2] Installing skills..."
mkdir -p "$SKILL_DIR"
cp -r skill/* "$SKILL_DIR/"
echo "  -> $SKILL_DIR/ ($(ls -d skill/*/ 2>/dev/null | wc -l | tr -d ' ') sub-skills + root)"

# Create data directory
echo "[2/2] Creating data directory..."
mkdir -p "$DATA_DIR"
echo "  -> $DATA_DIR/"

echo ""
echo "Done! Run '/slack-monitoring:setup' in Claude Code to configure."
