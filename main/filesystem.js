const express = require('express');
const fs = require('fs');
const path = require('path');
const {resolvePath} = require('./utils');

const router = express.Router();

router.get('/list', async (req, res) => {
  try {
    const relativePath = req.query.path || '/';
    const dirPath = resolvePath(relativePath);
    if (!fs.existsSync(dirPath)) return res.json([]);
    const files = await fs.promises.readdir(dirPath);
    const items = await Promise.all(
      files.map(async file => {
        const itemPath = path.join(dirPath, file);
        const stats = await fs.promises.stat(itemPath);
        const item = {
          name: file,
          path: path.join(relativePath, file).replace(/\\/g, '/'),
          type: stats.isDirectory() ? 'folder' : 'file',
        };
        if (file.endsWith('.app')) {
          try {
            item.content = await fs.promises.readFile(itemPath, 'utf-8');
          } catch (e) {
            /* ignore */
          }
        }
        return item;
      }),
    );
    res.json(items);
  } catch (error) {
    console.error(`API Error listing directory ${req.query.path}:`, error);
    res.status(500).json({error: 'Failed to list directory'});
  }
});

router.get('/read', async (req, res) => {
  try {
    const relativePath = req.query.path;
    const filePath = resolvePath(relativePath);
    const content = await fs.promises.readFile(filePath, 'utf-8');
    res.json({name: path.basename(relativePath), path: relativePath, content});
  } catch (error) {
    console.error(`API Error reading file ${req.query.path}:`, error);
    res.status(500).json({error: 'Failed to read file'});
  }
});

router.get('/read-base64', async (req, res) => {
  try {
    const relativePath = req.query.path;
    const filePath = resolvePath(relativePath);
    const contentBuffer = await fs.promises.readFile(filePath);
    res.json({
      name: path.basename(relativePath),
      path: relativePath,
      content: contentBuffer.toString('base64'),
    });
  } catch (error) {
    console.error(`API Error reading file as base64 ${req.query.path}:`, error);
    res.status(500).json({error: 'Failed to read file'});
  }
});

router.get('/download', (req, res) => {
  try {
    const relativePath = req.query.path;
    const filePath = resolvePath(relativePath);
    res.download(filePath, path.basename(relativePath), err => {
      if (err) {
        console.error(
          `API Error during file download for ${req.query.path}:`,
          err,
        );
        if (!res.headersSent) {
          res.status(500).json({error: 'Failed to download file'});
        }
      }
    });
  } catch (error) {
    console.error(
      `API Error setting up download for ${req.query.path}:`,
      error,
    );
    if (!res.headersSent) {
      res.status(500).json({error: 'Failed to initiate download'});
    }
  }
});

router.post('/save', async (req, res) => {
  try {
    const {path: relativePath, content} = req.body;
    const filePath = resolvePath(relativePath);
    await fs.promises.writeFile(filePath, content, 'utf-8');
    res.json({success: true});
  } catch (error) {
    console.error(`API Error saving file ${req.body.path}:`, error);
    res.status(500).json({error: 'Failed to save file'});
  }
});

router.post('/find-unique-name', (req, res) => {
  const {
    destinationPath: destRelativePath,
    baseName,
    isFolder,
    extension,
  } = req.body;
  const destPath = resolvePath(destRelativePath);
  let counter = 0;
  let newName = `${baseName}${isFolder ? '' : extension}`;
  let fullPath = path.join(destPath, newName);
  while (fs.existsSync(fullPath)) {
    counter++;
    newName = `${baseName} (${counter})${isFolder ? '' : extension}`;
    fullPath = path.join(destPath, newName);
  }
  res.json({name: newName});
});

router.post('/create-folder', async (req, res) => {
  try {
    const {path: relativePath, name} = req.body;
    await fs.promises.mkdir(resolvePath(path.join(relativePath, name)), {
      recursive: true,
    });
    res.json({success: true});
  } catch (error) {
    console.error('API Error creating folder:', error);
    res.status(500).json({error: 'Failed to create folder'});
  }
});

router.post('/create-file', async (req, res) => {
  try {
    const {path: relativePath, name, content} = req.body;
    await fs.promises.writeFile(
      resolvePath(path.join(relativePath, name)),
      content,
      'utf-8',
    );
    res.json({success: true});
  } catch (error) {
    console.error('API Error creating file:', error);
    res.status(500).json({error: 'Failed to create file'});
  }
});

router.post('/create-shortcut', async (req, res) => {
  try {
    const {appId, appName} = req.body;
    const shortcutPath = resolvePath(path.join('Desktop', `${appName}.app`));
    const shortcutContent = JSON.stringify({appId});
    await fs.promises.writeFile(shortcutPath, shortcutContent, 'utf-8');
    res.json({success: true});
  } catch (error) {
    console.error('API Error creating shortcut:', error);
    res.status(500).json({error: 'Failed to create shortcut'});
  }
});

router.post('/delete', async (req, res) => {
  try {
    const item = req.body.item;
    const itemPath = resolvePath(item.path);
    if (item.type === 'folder') {
      await fs.promises.rm(itemPath, {recursive: true, force: true});
    } else {
      await fs.promises.unlink(itemPath);
    }
    res.json({success: true});
  } catch (error) {
    console.error('API Error deleting item:', error);
    res.status(500).json({error: 'Failed to delete item'});
  }
});

router.post('/rename', async (req, res) => {
  try {
    const {item, newName} = req.body;
    const oldPath = resolvePath(item.path);
    const newPath = resolvePath(path.join(path.dirname(item.path), newName));
    await fs.promises.rename(oldPath, newPath);
    res.json({success: true});
  } catch (error) {
    console.error('API Error renaming item:', error);
    res.status(500).json({error: 'Failed to rename item'});
  }
});

router.post('/move', async (req, res) => {
  try {
    const {sourceItem, destinationPath} = req.body;
    const sourcePath = resolvePath(sourceItem.path);
    const destPath = resolvePath(path.join(destinationPath, sourceItem.name));
    await fs.promises.rename(sourcePath, destPath);
    res.json({success: true});
  } catch (error) {
    console.error('API Error moving item:', error);
    res.status(500).json({error: 'Failed to move item'});
  }
});

router.post('/copy', async (req, res) => {
  try {
    const {sourceItem, destinationPath} = req.body;
    const sourcePath = resolvePath(sourceItem.path);
    const destPath = resolvePath(path.join(destinationPath, sourceItem.name));
    await fs.promises.cp(sourcePath, destPath, {recursive: true});
    res.json({success: true});
  } catch (error) {
    console.error('API Error copying item:', error);
    res.status(500).json({error: 'Failed to copy item'});
  }
});

router.post('/create-link', async (req, res) => {
  try {
    const {targetPath} = req.body;
    if (!targetPath) {
      return res.status(400).json({error: 'targetPath is required'});
    }

    const absoluteTargetPath = resolvePath(targetPath);
    const stats = await fs.promises.stat(absoluteTargetPath);

    const targetDir = path.dirname(targetPath);
    const targetBaseName = path.parse(targetPath).name; // "file" from "file.txt"

    // Ensure the shortcut name is unique
    let counter = 0;
    let shortcutName = `${targetBaseName} - Shortcut.lnk`;
    let absoluteShortcutPath = resolvePath(path.join(targetDir, shortcutName));

    // A loop to find a unique name if the default already exists.
    while (fs.existsSync(absoluteShortcutPath)) {
      counter++;
      shortcutName = `${targetBaseName} - Shortcut (${counter}).lnk`;
      absoluteShortcutPath = resolvePath(path.join(targetDir, shortcutName));
    }

    const shortcutContent = JSON.stringify({
      target: targetPath,
      type: stats.isDirectory() ? 'folder' : 'file',
    });

    await fs.promises.writeFile(absoluteShortcutPath, shortcutContent, 'utf-8');
    res.json({success: true, path: path.join(targetDir, shortcutName)});
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({error: 'Target file or folder not found.'});
    } else {
      console.error('API Error creating link:', error);
      res.status(500).json({error: 'Failed to create link'});
    }
  }
});

module.exports = router;
