let activeChildProcesses = [];

/**
 * Adds a child process to the active list.
 * @param {import('child_process').ChildProcess} child The child process to add.
 */
function add(child) {
  activeChildProcesses.push(child);
}

/**
 * Removes a child process from the active list.
 * @param {import('child_process').ChildProcess} child The child process to remove.
 */
function remove(child) {
  activeChildProcesses = activeChildProcesses.filter(p => p.pid !== child.pid);
}

/**
 * Returns a copy of the list of all active child processes.
 * @returns {import('child_process').ChildProcess[]}
 */
function getAll() {
  return [...activeChildProcesses];
}

/**
 * Clears the list of all active child processes.
 */
function clear() {
  activeChildProcesses = [];
}

module.exports = {
  add,
  remove,
  getAll,
  clear,
};
