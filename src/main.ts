import * as path from 'path';
import { dialog } from 'electron/main';
import { app, BrowserWindow, ipcMain, Notification } from 'electron';

import { BASE_IMG_URL } from '../src/config.json';

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
  mainWindow.setIcon(path.join(__dirname, '../assets/icon.png'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

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

// Handle downloads from renderer processes.
ipcMain.handle('download', async (event, args) => {
  const book = args.payload.book as Book;

  // Get the directory path.
  const dirs = dialog.showOpenDialogSync({ properties: ['openDirectory'] });
  if (!dirs) return Promise.reject('Directory paths are undefined.');

  // Get the browser window.
  const browserWindow = BrowserWindow.getAllWindows()[0];

  // Initiate progress bar.
  browserWindow.setProgressBar(0);

  // Build an array of files.
  const files: Array<DownloadFile> = buildFileArray(book, dirs[0]);

  // Download all files.
  download(browserWindow, files);

  return Promise.resolve();
});

// Handle notification from renderer processes.
ipcMain.on('notify', (event, args) => notify(args.msg));

function notify(msg: string) {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title: msg,
    });

    notification.show();
  } else {
    // TODO: Handle not supported.
  }
}

function buildFileArray(book: Book, dir: string) {
  return book.images.pages.map((page, index) => {
    const imgExt = page.t === 'j' ? '.jpg' : '.png';

    // Use *nix style file path for non Windows OSes.
    const filePathOS =
      process.platform === 'win32'
        ? `${dir}\\${book.title.english}\\${index + 1}${imgExt}`
        : `${dir}/${book.title.english}/${index + 1}${imgExt}`;

    return {
      url: `${BASE_IMG_URL}/${book.media_id}/${index + 1}${imgExt}`,
      filePath: filePathOS,
    };
  });
}

function download(browserWindow: BrowserWindow, files: Array<DownloadFile>, counter = 1) {
  if (counter > files.length) {
    // Download completed.
    notify('Download completed.');
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
