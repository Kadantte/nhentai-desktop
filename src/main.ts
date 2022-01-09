import * as path from 'path';
import { dialog } from 'electron/main';
import { app, BrowserWindow, ipcMain } from 'electron';

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
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, '../src/index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Handle download
  ipcMain.handle('download', async (event, args) => {
    const { itemData, galleryUrl, imgExt } = args.payload;

    // Get directory to save to
    const selectedDirs = dialog.showOpenDialogSync({
      properties: ['openDirectory'],
    });

    if (!selectedDirs) {
      return Promise.reject('Directory paths is undefined.');
    }

    const baseUrl = `${galleryUrl}/${itemData.media_id}`;
    const directory = `${selectedDirs[0]}\\${itemData.title.english}`;

    // Initiate progress bar
    mainWindow.setProgressBar(0);

    // Download all images.
    download(1, directory, imgExt, itemData.num_pages, baseUrl, mainWindow);

    return Promise.resolve();
  });
};

function download(
  fileNum: number,
  directory: string,
  fileExt: string,
  fileCnt: number,
  baseUrl: string,
  window: BrowserWindow
) {
  if (fileNum > fileCnt) {
    // Download completed
    // TODO: Notify
    window.setProgressBar(-1);
    return;
  }

  const fileUrl = `${baseUrl}/${fileNum}${fileExt}`;
  const savePath = `${directory}\\${fileNum}${fileExt}`;

  // Set file path before downloading the file.
  // When done, start downloading the next file.
  window.webContents.session.once(
    'will-download',
    (event, item, webContents) => {
      item.setSavePath(savePath);
      item.once('done', (event, state) => {
        // TODO: Check state and handle errors
        window.setProgressBar(fileNum / fileCnt);
        download(fileNum + 1, directory, fileExt, fileCnt, baseUrl, window);
      });
    }
  );

  window.webContents.downloadURL(fileUrl);
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
