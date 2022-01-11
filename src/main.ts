import * as path from 'path';
import { dialog } from 'electron/main';
import { app, BrowserWindow, ipcMain } from 'electron';

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
  const { itemData, galleryUrl, imgExt } = args.payload;

  // Get the directory.
  const dirs = dialog.showOpenDialogSync({ properties: ['openDirectory'] });
  if (!dirs) return Promise.reject('Directory paths are undefined.');

  const baseUrl = `${galleryUrl}/${itemData.media_id}`;
  const directory = `${dirs[0]}\\${itemData.title.english}`;

  // Initiate progress bar.
  BrowserWindow.getFocusedWindow().setProgressBar(0);

  // Build an array of files.
  const files: Array<File> = [];
  for (var i = 1; i <= itemData.num_pages; i++) {
    files.push({
      url: `${baseUrl}/${i}${imgExt}`,
      filePath: `${directory}\\${i}${imgExt}`,
    });
  }

  // Download all images.
  download(files, 1);

  return Promise.resolve();
});

function download(files: Array<File>, counter: number) {
  const window = BrowserWindow.getFocusedWindow();

  if (counter > files.length) {
    // Download completed.
    dialog.showMessageBox(window, {
      title: 'Notification',
      message: `Download completed.`,
      type: 'info',
    });
    // Reset progress bar.
    window.setProgressBar(-1);
    return;
  }

  window.webContents.session.once('will-download', (event, item) => {
    // Set file path before downloading the file.
    item.setSavePath(files[counter - 1].filePath);
    // Once done, start downloading the next file.
    item.once('done', (event, state) => {
      // TODO: Check the state and handle errors.
      window.setProgressBar(counter / files.length);
      download(files, counter + 1);
    });
  });

  window.webContents.downloadURL(files[counter - 1].url);
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
