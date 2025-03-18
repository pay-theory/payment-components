#!/usr/bin/env node

/**
 * Sequential test runner for Payment Components
 *
 * This script runs tests sequentially one file at a time to prevent resource conflicts
 * and avoid hanging issues.
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Configuration
const TEST_DIR = './test';
const TEST_TIMEOUT = 20000; // 20 seconds per test file
const TEST_PATTERN = '*.web-test.js';

// Order tests from simplest to most complex
const TEST_ORDER = [
  'basic.web-test.js',
  'fee-validation.web-test.js',
  'fee-validation-edge-cases.web-test.js',
  'improved-fee-validation.web-test.js',
  // More complex component tests last
  'credit-card.web-test.js',
  'createPaymentFields.web-test.js',
  'bank-routing-number.web-test.js',
  'bank-account-number.web-test.js',
  'bank-institution-number.web-test.js',
];

async function getTestFiles() {
  try {
    const files = await fs.readdir(TEST_DIR);
    return files
      .filter(f => f.endsWith('.web-test.js'))
      .sort((a, b) => {
        // Sort based on the predefined order
        const indexA = TEST_ORDER.indexOf(a);
        const indexB = TEST_ORDER.indexOf(b);

        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
  } catch (err) {
    console.error('Error reading test directory:', err);
    return [];
  }
}

async function runTestFile(file) {
  console.log(`\n\n========== RUNNING TEST: ${file} ==========\n`);

  try {
    // Use --watch=false to ensure tests complete and don't wait for user input
    const cmd = `npx web-test-runner ${join(TEST_DIR, file)} --node-resolve --watch=false --timeout ${TEST_TIMEOUT}`;
    console.log(`> ${cmd}\n`);

    const { stdout, stderr } = await execPromise(cmd);
    console.log(stdout);
    if (stderr) console.error(stderr);

    return true;
  } catch (err) {
    console.error(`Test failed: ${file}`);
    console.error(err.message);
    if (err.stdout) console.log(err.stdout);
    if (err.stderr) console.error(err.stderr);
    return false;
  }
}

async function main() {
  console.log('========== STARTING SEQUENTIAL TEST RUN ==========');

  const files = await getTestFiles();
  console.log(`Found ${files.length} test files to run\n`);

  let passCount = 0;
  let failCount = 0;
  const failedTests = [];

  for (const file of files) {
    try {
      const success = await runTestFile(file);
      if (success) {
        passCount++;
      } else {
        failCount++;
        failedTests.push(file);
      }
    } catch (err) {
      console.error(`Error running test ${file}:`, err);
      failCount++;
      failedTests.push(file);
    }

    // Short delay between tests to allow resources to be cleaned up
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n\n========== TEST RUN COMPLETE ==========');
  console.log(`Total: ${files.length}, Passed: ${passCount}, Failed: ${failCount}`);

  if (failedTests.length > 0) {
    console.log('\nFailed tests:');
    failedTests.forEach(f => console.log(` - ${f}`));
    process.exit(1);
  } else {
    console.log('\nAll tests passed successfully!');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
