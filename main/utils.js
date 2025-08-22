const path = require('path');
const {FS_ROOT} = require('./constants');

/**
 * Resolves a relative path to an absolute path within the project's root directory.
 * This is a security measure to prevent path traversal attacks.
 * @param {string} relativePath - The path relative to the project root.
 * @returns {string} The resolved absolute path.
 * @throws {Error} If the path is outside the allowed root directory.
 */
function resolvePath(relativePath) {
  const fullPath = path.join(FS_ROOT, relativePath);
  if (!fullPath.startsWith(FS_ROOT)) {
    throw new Error(
      'Access denied: Path is outside of the allowed root directory.',
    );
  }
  return fullPath;
}

module.exports = {resolvePath};
