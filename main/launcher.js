const path = require('path');
const {spawn} = require('child_process');
const {FS_ROOT} = require('./constants');
const {add, remove} = require('./child-process-store');

function launchExternalAppByPath(relativeAppPath, args = []) {
  try {
    const appDir = path.join(FS_ROOT, relativeAppPath);
    const appName = path.basename(appDir);

    // This is the definitive, correct way to launch the child process.
    // 1. We call the main Electron executable (`process.execPath`).
    // 2. The first argument is the path to the application directory we want to launch.
    // 3. We add `--launched-by-host` so the child process knows not to re-initialize servers.
    const spawnArgs = [appDir, '--launched-by-host', ...args];

    console.log(
      `[Launcher] Spawning: ${process.execPath} ${spawnArgs.join(' ')}`,
    );

    const child = spawn(process.execPath, spawnArgs, {
      stdio: 'pipe',
      // Provide the NODE_PATH to ensure the child can find the parent's `electron` module.
      // This is critical for preventing "Cannot find module" errors.
      env: {
        ...process.env,
        NODE_PATH: path.resolve(FS_ROOT, 'node_modules'),
      },
    });

    child.stdout.on('data', data => {
      console.log(`[${appName}] stdout: ${data}`);
    });

    child.stderr.on('data', data => {
      console.error(`[${appName}] stderr: ${data}`);
    });

    child.on('error', err => {
      console.error(
        `[Launcher] Failed to start subprocess for ${appName}. Error: ${err.message}`,
      );
    });

    child.on('exit', (code, signal) => {
      if (code !== 0) {
        console.error(
          `[Launcher] Subprocess for ${appName} exited with code ${code} and signal ${signal}`,
        );
      }
      remove(child); // Remove from tracking when it exits
    });

    add(child); // Add to tracking

    return true;
  } catch (error) {
    console.error(
      `Error launching external app for path ${relativeAppPath}:`,
      error,
    );
    return false;
  }
}

module.exports = {launchExternalAppByPath};
