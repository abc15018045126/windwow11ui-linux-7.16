const express = require('express');
const cors = require('cors');
const os = require('os');
const fs = require('fs');
const path = require('path');
const {FS_ROOT} = require('./constants');
const fsRouter = require('./filesystem');
const {launchExternalAppByPath} = require('./launcher');
const {API_PORT} = require('./constants');
const fetch = require('node-fetch');

function startApiServer() {
  const apiApp = express();
  apiApp.use(cors());
  apiApp.use(express.json({limit: '50mb'}));

  // API endpoint to provide the API key
  apiApp.get('/api/get-key', (req, res) => {
    res.json({apiKey: process.env.API_KEY});
  });

  apiApp.get('/api/os-user', (req, res) => {
    try {
      res.json({username: os.userInfo().username});
    } catch (error) {
      console.error('API Error getting OS user:', error);
      res.status(500).json({error: 'Failed to get OS username'});
    }
  });

  // Web Proxy Endpoint for Chrome 7
  apiApp.get('/api/proxy', async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).send('URL query parameter is required.');
    }

    try {
      // Basic validation to ensure it's a valid URL
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).send('Invalid URL protocol.');
      }

      const response = await fetch(url);
      const text = await response.text();

      // For now, just send the raw HTML.
      // In the future, we would parse and rewrite links here.
      res.send(text);

    } catch (error) {
      console.error(`[API Proxy] Failed to fetch URL: ${url}`, error);
      res.status(500).send(`Failed to fetch URL: ${url}. Error: ${error.message}`);
    }
  });

  // App Discovery Endpoint
  apiApp.get('/api/apps', async (req, res) => {
    try {
      const appsDir = path.join(FS_ROOT, 'components', 'apps');
      const entries = await fs.promises.readdir(appsDir, {withFileTypes: true});

      const registryPath = path.join(FS_ROOT, 'main', 'data', 'external-apps.json');
      let installedIds = new Set();
      try {
        const data = await fs.promises.readFile(registryPath, 'utf-8');
        const installedApps = JSON.parse(data);
        installedIds = new Set(installedApps.map(app => app.id));
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.error('Could not read external app registry for checking installed status:', error);
        }
        // If file doesn't exist, installedIds remains an empty set, which is correct.
      }

      const appPromises = entries
        .filter(entry => entry.isDirectory())
        .map(async dir => {
          try {
            const packageJsonPath = path.join(
              appsDir,
              dir.name,
              'package.json',
            );
            await fs.promises.access(packageJsonPath); // Check if package.json exists

            const content = await fs.promises.readFile(
              packageJsonPath,
              'utf-8',
            );
            const pkg = JSON.parse(content);
            const appId = dir.name.toLowerCase();

            const isInstalled = installedIds.has(appId);

            return {
              id: appId,
              name: dir.name,
              description: pkg.description || 'A discovered application.',
              version: pkg.version || '1.0.0',
              isExternal: true,
              path: path.join('components', 'apps', dir.name),
              isInstalled: isInstalled,
            };
          } catch (e) {
            // Ignore directories that are not valid apps (e.g., no package.json)
            return null;
          }
        });

      const apps = (await Promise.all(appPromises)).filter(Boolean);
      res.json(apps);
    } catch (error) {
      console.error('API Error getting app list:', error);
      res.status(500).json({error: 'Failed to get app list'});
    }
  });

  // API Endpoint to get the list of externally registered apps
  apiApp.get('/api/apps/external', async (req, res) => {
    try {
      const filePath = path.join(FS_ROOT, 'main', 'data', 'external-apps.json');
      const data = await fs.promises.readFile(filePath, 'utf-8');
      res.setHeader('Content-Type', 'application/json');
      res.send(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // If the file doesn't exist, return an empty array, which is valid.
        res.json([]);
      } else {
        console.error('API Error getting external app list:', error);
        res.status(500).json({error: 'Failed to get external app list'});
      }
    }
  });

  // Endpoint to "install" an app by adding it to the external-apps.json registry
  apiApp.post('/api/install', async (req, res) => {
    const {id, name, path: appPath, version, description} = req.body;
    if (!id || !name || !appPath) {
      return res
        .status(400)
        .json({error: 'Missing required app details for installation.'});
    }

    const registryPath = path.join(FS_ROOT, 'main', 'data', 'external-apps.json');
    const componentName = name.replace(/-/g, ''); // Sanitize name for JS variable

    try {
      let registry = [];
      try {
        const data = await fs.promises.readFile(registryPath, 'utf-8');
        registry = JSON.parse(data);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        // File doesn't exist, we'll create it with the new app.
      }

      const isAlreadyInstalled = registry.some(app => app.id === id);
      if (isAlreadyInstalled) {
        return res
          .status(409)
          .json({error: `App "${name}" is already installed.`});
      }

      const newAppEntry = {
        id,
        name,
        icon: id, // Use the app's ID as a default icon identifier
        isExternal: true,
        externalPath: path.join(appPath, 'main.js'), // Point to the conventional entry point
        version: version || '1.0.0',
        description: description || 'An installed external application.',
      };

      registry.push(newAppEntry);

      await fs.promises.writeFile(
        registryPath,
        JSON.stringify(registry, null, 2),
      );

      console.log(`Successfully added "${name}" to the external app registry.`);
      res
        .status(201)
        .json({success: true, message: `App "${name}" installed.`});
    } catch (error) {
      console.error(`Failed to install app "${name}":`, error);
      res.status(500).json({error: `Failed to install app "${name}".`});
    }
  });

  // New route to launch external apps
  apiApp.post('/api/launch', (req, res) => {
    const {path: relativeAppPath, args} = req.body;
    if (!relativeAppPath) {
      return res.status(400).json({error: 'Missing path in request body'});
    }

    const success = launchExternalAppByPath(relativeAppPath, args);

    if (success) {
      res.json({success: true, message: 'App launch initiated.'});
    } else {
      res.status(500).json({error: 'Failed to launch application.'});
    }
  });

  // Pinned Apps Endpoints
  const PINNED_APPS_PATH = path.join(FS_ROOT, 'main', 'data', 'pinned-apps.json');

  apiApp.get('/api/pinned-apps', async (req, res) => {
    try {
      const data = await fs.promises.readFile(PINNED_APPS_PATH, 'utf-8');
      res.json(JSON.parse(data));
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.json([]); // File doesn't exist, return empty array
      } else {
        console.error('API Error getting pinned apps:', error);
        res.status(500).json({ error: 'Failed to get pinned apps' });
      }
    }
  });

  apiApp.post('/api/pinned-apps', async (req, res) => {
    const { pinnedAppIds } = req.body;
    if (!Array.isArray(pinnedAppIds)) {
      return res.status(400).json({ error: 'Invalid payload: pinnedAppIds must be an array.' });
    }
    try {
      await fs.promises.writeFile(PINNED_APPS_PATH, JSON.stringify(pinnedAppIds, null, 2));
      res.json({ success: true });
    } catch (error) {
      console.error('API Error saving pinned apps:', error);
      res.status(500).json({ error: 'Failed to save pinned apps' });
    }
  });

  // All filesystem APIs are prefixed with /api/fs
  apiApp.use('/api/fs', fsRouter);

  apiApp.listen(API_PORT, () => {
    console.log(`✅ API server listening on http://localhost:${API_PORT}`);
  });
}

module.exports = {startApiServer};
