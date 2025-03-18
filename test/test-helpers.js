/**
 * Helper file to load TypeScript modules for the Web Test Runner
 */

/**
 * Dynamically imports a TypeScript module
 * @param {string} path - Path to the TypeScript module
 * @returns {Promise<Object>} - The imported module
 */
export async function importTsModule(path) {
  try {
    // This uses dynamic import to load the module
    return await import(path);
  } catch (error) {
    console.error(`Error importing module from ${path}:`, error);
    throw error;
  }
}
