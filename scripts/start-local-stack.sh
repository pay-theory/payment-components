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

# Checks whether a repository defines a given npm script in package.json.
# This keeps default command selection resilient across repos that use either
# `dev` or `start` for local development.
has_npm_script() {
  local repo_path="$1"
  local script_name="$2"
  local package_json_path="${repo_path}/package.json"

  if [[ ! -f "$package_json_path" ]]; then
    return 1
  fi

  node -e '
const fs = require("fs");
const packageJsonPath = process.argv[1];
const scriptName = process.argv[2];
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  process.exit(packageJson.scripts && packageJson.scripts[scriptName] ? 0 : 1);
} catch (error) {
  process.exit(1);
}
' "$package_json_path" "$script_name" >/dev/null 2>&1
}

resolve_checkout_command() {
  local checkout_repo_path="$1"

  if [[ -n "${CHECKOUT_COMMAND:-}" ]]; then
    echo "${CHECKOUT_COMMAND}"
    return
  fi

  if has_npm_script "$checkout_repo_path" "dev"; then
    echo "npm run dev"
    return
  fi

  if has_npm_script "$checkout_repo_path" "start"; then
    # books-app-checkout commonly uses CRA `start`, and checkout traffic is
    # expected on port 3002 in local stack mode.
    echo "PORT=3002 npm start"
    echo "Auto-selected checkout command: PORT=3002 npm start (no dev script found)." >&2
    return
  fi

  echo "npm run dev"
  echo "Falling back to checkout command: npm run dev (no dev/start script detected)." >&2
}

print_local_test_env_config_hint() {
  local local_test_env_config="${REPO_ROOT}/local-test/env-config.local.js"
  if [[ -f "$local_test_env_config" ]]; then
    return
  fi

  cat <<'EOF'
Note: local-test/env-config.local.js is missing.
Copy local-test/env-config.js to local-test/env-config.local.js and set:
  - PAYTHEORY_API_KEY
  - GOOGLE_MERCHANT_ID
  - GOOGLE_GATEWAY_MERCHANT_ID
EOF
  echo
}

run_npm_install_if_needed() {
  local service_name="$1"
  local repo_path="$2"
  local package_json_path="${repo_path}/package.json"

  if [[ ! -d "$repo_path" ]]; then
    echo "Skipping dependency install for ${service_name}: repository not found at ${repo_path}"
    return 0
  fi

  if [[ ! -f "$package_json_path" ]]; then
    echo "Skipping dependency install for ${service_name}: package.json not found at ${package_json_path}"
    return 0
  fi

  if [[ -d "${repo_path}/node_modules" ]]; then
    echo "Dependencies already installed for ${service_name} (node_modules present)."
    return 0
  fi

  echo "Installing dependencies for ${service_name} (node_modules missing)..."
  (
    cd "$repo_path"
    npm install
  )
}

checkout_uses_local_pay_theory_ui() {
  local checkout_repo_path="$1"
  local checkout_package_json_path="${checkout_repo_path}/package.json"

  if [[ ! -f "$checkout_package_json_path" ]]; then
    return 1
  fi

  node -e '
const fs = require("fs");
const packageJsonPath = process.argv[1];
const dependencyName = "@paytheory/pay-theory-ui";

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const sections = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
  const usesLocalDependency = sections.some((sectionName) => {
    const section = packageJson[sectionName] || {};
    const rawValue = section[dependencyName];
    return typeof rawValue === "string" && rawValue.startsWith("file:../pay-theory-ui");
  });
  process.exit(usesLocalDependency ? 0 : 1);
} catch (error) {
  process.exit(1);
}
' "$checkout_package_json_path" >/dev/null 2>&1
}

clone_pay_theory_ui_repo() {
  local pay_theory_ui_path="$1"

  if [[ -n "${GITHUB_ACCESS_TOKEN:-}" ]]; then
    if GIT_TERMINAL_PROMPT=0 git clone "https://${GITHUB_ACCESS_TOKEN}@github.com/pay-theory/pay-theory-ui.git" "$pay_theory_ui_path"; then
      return 0
    fi
    echo "Token-based pay-theory-ui clone failed; trying SSH fallback."
  fi

  if GIT_SSH_COMMAND="ssh -o BatchMode=yes" git clone "git@github.com:pay-theory/pay-theory-ui.git" "$pay_theory_ui_path"; then
    return 0
  fi

  echo "Unable to clone pay-theory-ui. Ensure repo access and set GITHUB_ACCESS_TOKEN if needed."
  return 1
}

bootstrap_checkout_pay_theory_ui() {
  local checkout_repo_path="$1"

  if [[ ! -d "$checkout_repo_path" ]]; then
    echo "Skipping pay-theory-ui bootstrap: checkout repository not found at ${checkout_repo_path}"
    return 0
  fi

  if ! checkout_uses_local_pay_theory_ui "$checkout_repo_path"; then
    return 0
  fi

  local pay_theory_ui_path
  pay_theory_ui_path="$(cd "${checkout_repo_path}/.." && pwd)/pay-theory-ui"

  if [[ ! -d "$pay_theory_ui_path" ]]; then
    echo "books-app-checkout expects ../pay-theory-ui. Cloning now..."
    clone_pay_theory_ui_repo "$pay_theory_ui_path"
  fi

  run_npm_install_if_needed "pay-theory-ui" "$pay_theory_ui_path"

  # books-app-checkout imports the compiled dist artifacts from pay-theory-ui.
  if [[ ! -d "${pay_theory_ui_path}/dist" ]]; then
    echo "Building pay-theory-ui (dist missing)..."
    (
      cd "$pay_theory_ui_path"
      npm run build
    )
  else
    echo "pay-theory-ui dist already present; skipping build."
  fi

  if [[ -d "${pay_theory_ui_path}/node_modules" ]]; then
    # Match CI buildspec behavior to avoid duplicate React bundles at runtime.
    rm -rf \
      "${pay_theory_ui_path}/node_modules/react" \
      "${pay_theory_ui_path}/node_modules/react-dom" \
      "${pay_theory_ui_path}/node_modules/react-router-dom" \
      "${pay_theory_ui_path}/node_modules/react-router" \
      "${pay_theory_ui_path}/node_modules/@remix-run"
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
CHECKOUT_REPO_PATH="$(resolve_repo_path "${CHECKOUT_REPO_PATH:-books-app-checkout}")"
BOOKS_APP_REPO_PATH="$(resolve_repo_path "${BOOKS_APP_REPO_PATH:-books-app}")"

PAYMENT_COMPONENTS_COMMAND="${PAYMENT_COMPONENTS_COMMAND:-npm run dev:local}"
SECURE_TAGS_LIB_COMMAND="${SECURE_TAGS_LIB_COMMAND:-npm run dev:local}"
CHECKOUT_COMMAND="$(resolve_checkout_command "$CHECKOUT_REPO_PATH")"
BOOKS_APP_COMMAND="${BOOKS_APP_COMMAND:-npm run dev}"

LOCAL_HOSTED_FIELDS_ENDPOINT_EFFECTIVE="${LOCAL_HOSTED_FIELDS_ENDPOINT:-https://localhost:3001}"
LOCAL_HOSTED_CHECKOUT_ENDPOINT_EFFECTIVE="${LOCAL_HOSTED_CHECKOUT_ENDPOINT:-http://localhost:3002}"

echo "Local stack configuration"
echo "  stack root             : ${STACK_ROOT}"
echo "  local sdk dev          : ${LOCAL_DEV_EFFECTIVE}"
echo "  local hosted fields    : ${LOCAL_HOSTED_FIELDS_EFFECTIVE} (${LOCAL_HOSTED_FIELDS_ENDPOINT_EFFECTIVE})"
echo "  local hosted checkout  : ${LOCAL_HOSTED_CHECKOUT_EFFECTIVE} (${LOCAL_HOSTED_CHECKOUT_ENDPOINT_EFFECTIVE})"
echo
print_local_test_env_config_hint

if [[ "$START_PAYMENT_COMPONENTS_EFFECTIVE" == "true" ]]; then
  run_npm_install_if_needed "payment-components" "$PAYMENT_COMPONENTS_REPO_PATH"
fi

if [[ "$START_SECURE_TAGS_LIB_EFFECTIVE" == "true" ]]; then
  run_npm_install_if_needed "secure-tags-lib" "$SECURE_TAGS_LIB_REPO_PATH"
fi

if [[ "$START_CHECKOUT_EFFECTIVE" == "true" ]]; then
  bootstrap_checkout_pay_theory_ui "$CHECKOUT_REPO_PATH"
  run_npm_install_if_needed "books-app-checkout" "$CHECKOUT_REPO_PATH"
fi

if [[ "$START_BOOKS_APP_EFFECTIVE" == "true" ]]; then
  run_npm_install_if_needed "books-app" "$BOOKS_APP_REPO_PATH"
fi

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
  start_service "books-app-checkout" "$CHECKOUT_REPO_PATH" "$CHECKOUT_COMMAND" || true
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
