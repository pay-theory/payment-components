#!/usr/bin/env bash
set -euo pipefail

# Starts a local multi-repo development stack for payment-components integrations.
# Behavior is controlled by env vars so developers can run only what they need.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DEFAULT_STACK_ROOT="$(cd "${REPO_ROOT}/.." && pwd)"

STACK_ROOT="${STACK_ROOT:-$DEFAULT_STACK_ROOT}"

load_env_file() {
  local env_file="$1"
  if [[ -f "$env_file" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a
  fi
}

normalize_bool() {
  local raw_value="${1:-}"
  local default_value="${2:-false}"
  local lowered
  lowered="$(printf '%s' "$raw_value" | tr '[:upper:]' '[:lower:]')"

  case "$lowered" in
    1|true|yes|on)
      echo "true"
      ;;
    0|false|no|off)
      echo "false"
      ;;
    *)
      echo "$default_value"
      ;;
  esac
}

resolve_repo_path() {
  local repo_value="$1"
  if [[ "$repo_value" = /* ]]; then
    echo "$repo_value"
  else
    echo "${STACK_ROOT}/${repo_value}"
  fi
}

start_service() {
  local service_name="$1"
  local repo_path="$2"
  local service_command="$3"

  if [[ ! -d "$repo_path" ]]; then
    echo "Skipping ${service_name}: repository not found at ${repo_path}"
    return 1
  fi

  echo "Starting ${service_name}"
  echo "  repo: ${repo_path}"
  echo "  cmd : ${service_command}"

  (
    cd "$repo_path"
    bash -c "$service_command"
  ) &

  PIDS+=("$!")
  NAMES+=("$service_name")
  return 0
}

load_env_file "${REPO_ROOT}/.env"
load_env_file "${REPO_ROOT}/.env.local"

LOCAL_DEV_EFFECTIVE="$(normalize_bool "${LOCAL_DEV:-}" "false")"
LOCAL_HOSTED_FIELDS_EFFECTIVE="$(normalize_bool "${LOCAL_HOSTED_FIELDS:-}" "false")"
LOCAL_HOSTED_CHECKOUT_EFFECTIVE="$(normalize_bool "${LOCAL_HOSTED_CHECKOUT:-}" "false")"

START_PAYMENT_COMPONENTS_EFFECTIVE="$(normalize_bool "${START_PAYMENT_COMPONENTS:-}" "true")"
START_SECURE_TAGS_LIB_EFFECTIVE="$(normalize_bool "${START_SECURE_TAGS_LIB:-}" "$LOCAL_HOSTED_FIELDS_EFFECTIVE")"
START_CHECKOUT_EFFECTIVE="$(normalize_bool "${START_CHECKOUT:-}" "$LOCAL_HOSTED_CHECKOUT_EFFECTIVE")"
START_BOOKS_APP_EFFECTIVE="$(normalize_bool "${START_BOOKS_APP:-}" "false")"

PAYMENT_COMPONENTS_REPO_PATH="$(resolve_repo_path "${PAYMENT_COMPONENTS_REPO_PATH:-payment-components}")"
SECURE_TAGS_LIB_REPO_PATH="$(resolve_repo_path "${SECURE_TAGS_LIB_REPO_PATH:-secure-tags-lib}")"
CHECKOUT_REPO_PATH="$(resolve_repo_path "${CHECKOUT_REPO_PATH:-checkout}")"
BOOKS_APP_REPO_PATH="$(resolve_repo_path "${BOOKS_APP_REPO_PATH:-books-app}")"

PAYMENT_COMPONENTS_COMMAND="${PAYMENT_COMPONENTS_COMMAND:-npm run dev:local}"
SECURE_TAGS_LIB_COMMAND="${SECURE_TAGS_LIB_COMMAND:-npm run dev:local}"
CHECKOUT_COMMAND="${CHECKOUT_COMMAND:-npm run dev}"
BOOKS_APP_COMMAND="${BOOKS_APP_COMMAND:-npm run dev}"

LOCAL_HOSTED_FIELDS_ENDPOINT_EFFECTIVE="${LOCAL_HOSTED_FIELDS_ENDPOINT:-https://localhost:3001}"
LOCAL_HOSTED_CHECKOUT_ENDPOINT_EFFECTIVE="${LOCAL_HOSTED_CHECKOUT_ENDPOINT:-http://localhost:3002}"

echo "Local stack configuration"
echo "  stack root             : ${STACK_ROOT}"
echo "  local sdk dev          : ${LOCAL_DEV_EFFECTIVE}"
echo "  local hosted fields    : ${LOCAL_HOSTED_FIELDS_EFFECTIVE} (${LOCAL_HOSTED_FIELDS_ENDPOINT_EFFECTIVE})"
echo "  local hosted checkout  : ${LOCAL_HOSTED_CHECKOUT_EFFECTIVE} (${LOCAL_HOSTED_CHECKOUT_ENDPOINT_EFFECTIVE})"
echo

PIDS=()
NAMES=()

cleanup() {
  if [[ "${#PIDS[@]}" -eq 0 ]]; then
    return
  fi

  echo
  echo "Stopping local stack..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}

trap cleanup EXIT INT TERM

if [[ "$START_PAYMENT_COMPONENTS_EFFECTIVE" == "true" ]]; then
  start_service "payment-components" "$PAYMENT_COMPONENTS_REPO_PATH" "$PAYMENT_COMPONENTS_COMMAND" || true
fi

if [[ "$START_SECURE_TAGS_LIB_EFFECTIVE" == "true" ]]; then
  start_service "secure-tags-lib" "$SECURE_TAGS_LIB_REPO_PATH" "$SECURE_TAGS_LIB_COMMAND" || true
fi

if [[ "$START_CHECKOUT_EFFECTIVE" == "true" ]]; then
  start_service "checkout" "$CHECKOUT_REPO_PATH" "$CHECKOUT_COMMAND" || true
fi

if [[ "$START_BOOKS_APP_EFFECTIVE" == "true" ]]; then
  start_service "books-app" "$BOOKS_APP_REPO_PATH" "$BOOKS_APP_COMMAND" || true
fi

if [[ "${#PIDS[@]}" -eq 0 ]]; then
  echo "No services were started. Adjust START_* flags or repo paths and retry."
  exit 1
fi

echo
echo "Stack started. Open http://localhost:3000/local-test/ once payment-components is ready."
echo "Press Ctrl+C to stop all started services."
echo

for index in "${!PIDS[@]}"; do
  service_name="${NAMES[$index]}"
  service_pid="${PIDS[$index]}"
  if ! wait "$service_pid"; then
    exit_code=$?
    echo "${service_name} exited with code ${exit_code}"
    exit "$exit_code"
  fi
done
