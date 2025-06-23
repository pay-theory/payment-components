#!/usr/bin/env node

/**
 * This script runs the tests with a global timeout to prevent hanging.
 *
 * Usage:
 *   node test-safely.js [--timeout 60000] [--pattern "bank-routing-number"]
 *
 * Options:
 *   --timeout: Maximum time in ms before killing the test process (default: 60000)
 *   --pattern: Test pattern to match (passed to -g flag of web-test-runner)
 */

import { spawn } from 'child_process';

// Parse command-line arguments
const args = process.argv.slice(2);
let timeout = 60000; // Default timeout: 60 seconds
let pattern = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--timeout' && i + 1 < args.length) {
    timeout = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--pattern' && i + 1 < args.length) {
    pattern = args[i + 1];
    i++;
  }
}

// Build the test command
let testCommand = 'npx';
let testArgs = ['web-test-runner', 'test/**/*.web-test.js', '--node-resolve', '--watch=false'];

if (pattern) {
  testArgs.push('-g', pattern);
}

console.log(`Running tests with a ${timeout}ms timeout...`);
console.log(`Command: ${testCommand} ${testArgs.join(' ')}`);

// Start the test process
const testProcess = spawn(testCommand, testArgs, {
  stdio: 'inherit',
  shell: true,
});

// Set a timeout to kill the process if it hangs
const timeoutId = setTimeout(() => {
  console.error(`\n\n⚠️ Test execution timed out after ${timeout}ms!`);
  console.error('Terminating test runner...\n');
  testProcess.kill('SIGTERM');

  // Give the process a moment to shut down gracefully, then force kill if needed
  setTimeout(() => {
    if (!testProcess.killed) {
      console.error('Force killing test process...');
      testProcess.kill('SIGKILL');
    }
    process.exit(1);
  }, 5000);
}, timeout);

// Handle process completion
testProcess.on('close', code => {
  clearTimeout(timeoutId);
  console.log(`Tests completed with exit code: ${code}`);
  process.exit(code);
});

// Handle process errors
testProcess.on('error', err => {
  clearTimeout(timeoutId);
  console.error('Failed to start test process:', err);
  process.exit(1);
});
