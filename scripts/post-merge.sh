#!/usr/bin/env bash
set -euo pipefail

pnpm install --frozen-lockfile
pnpm --filter @workspace/scripts run rently:migrate -- --skip-if-unconfigured
pnpm -w run typecheck:libs
