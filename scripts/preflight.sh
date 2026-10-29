#!/bin/bash
# LendSpace Production Pre-Flight Shell Script Wrapper
set -e

echo "Starting LendSpace Production Pre-Flight Sanity Checks..."

PYTHON_BIN="./.venv/bin/python"
if [ ! -f "$PYTHON_BIN" ]; then
    PYTHON_BIN="python3"
fi

"$PYTHON_BIN" "./scripts/preflight.py"
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo "Pre-flight checks FAILED with exit code $EXIT_CODE" >&2
    exit $EXIT_CODE
fi

echo "Pre-flight checks completed successfully!"
exit 0

