import * as path from 'path';
import { dialog } from 'electron/main';
import { app, BrowserWindow, ipcMain } from 'electron';

const { BASE_IMG_URL } = require('../src/config.json');

interface File {
  url: string;
  filePath: string;
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 720,
    width: 1280,
    title: 'nHentai Desktop',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, '../src/index.html'));

  // Set the icon.
  mainWindow.setIcon(path.join(__dirname, '../src/assets/icon.ico'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// Handle downloads.
ipcMain.handle('download', async (event, args) => {
  const { book, imgExt } = args.payload;

  // Get the directory.
  const dirs = dialog.showOpenDialogSync({ properties: ['openDirectory'] });
  if (!dirs) return Promise.reject('Directory paths are undefined.');

  // Get the browser window.
  const browserWindow = BrowserWindow.getFocusedWindow();

  // Initiate progress bar.
  browserWindow.setProgressBar(0);

  // Build an array of files.
  const files: Array<File> = [];
  for (var i = 1; i <= book.num_pages; i++) {
    files.push({
      url: `${BASE_IMG_URL}/${book.media_id}/${i}${imgExt}`,
      filePath: `${dirs[0]}\\${book.title.english}\\${i}${imgExt}`,
    });
  }

  // Download all images.
  download(browserWindow, files);

  return Promise.resolve();
});

function download(
  browserWindow: BrowserWindow,
  files: Array<File>,
  counter: number = 1
) {
  if (counter > files.length) {
    // Download completed.
    dialog.showMessageBox(browserWindow, {
      title: 'Notification',
      message: `Download completed.`,
      type: 'info',
    });
    // Reset progress bar.
    browserWindow.setProgressBar(-1);
    return;
  }

  browserWindow.webContents.session.once('will-download', (event, item) => {
    // Set file path before downloading the file.
    item.setSavePath(files[counter - 1].filePath);
    // Once done, start downloading the next file.
    item.once('done', (event, state) => {
      // TODO: Check the state and handle errors.
      browserWindow.setProgressBar(counter / files.length);
      download(browserWindow, files, counter + 1);
    });
  });

  browserWindow.webContents.downloadURL(files[counter - 1].url);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
