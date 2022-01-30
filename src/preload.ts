import { ipcRenderer } from 'electron';

const { BASE_API_URL, BASE_IMG_URL } = require('../src/config.json');

window.addEventListener('DOMContentLoaded', () => {
  const btnSlotEl = document.getElementById('btn-slot');
  const bookUrlEl = document.getElementById('book-url');
  const fetchBtnEl = document.getElementById('fetch-btn');
  const bookTitleEl = document.getElementById('book-title');
  const bookContentEl = document.getElementById('book-content');
  const bookPageCntEl = document.getElementById('book-page-cnt');

  fetchBtnEl.addEventListener('click', onFetch);

  async function onFetch(e: SubmitEvent): Promise<void> {
    e.preventDefault();

    // Grab the url.
    const url = (<HTMLInputElement>bookUrlEl).value;
    if (url === '') throw new Error('URL is invalid.');

    // Get the book id.
    const bookId = url.match(/[0-9]/g).join('');
    if (bookId.length !== 6) throw new Error('Book ID is invalid.');

    // Fetch the book.
    const response = await fetch(`${BASE_API_URL}/${bookId}`);
    const book = await response.json();

    // Get the image extension.
    const imgExt = getImageExtension(book);
    if (imgExt === null) throw new Error('Cannot find image extension.');

    // Insert book info.
    bookTitleEl.innerHTML = book.title.english;
    bookPageCntEl.innerHTML = book.num_pages + ' Pages';
    btnSlotEl.appendChild(buildDownloadBtn(url));
    bookContentEl.innerHTML = '';

    // Insert the images.
    for (var i = 1; i <= book.num_pages; i++) {
      const imgEl = document.createElement('img');
      imgEl.src = `${BASE_IMG_URL}/${book.media_id}/${i}${imgExt}`;
      imgEl.alt = `Image ${i}`;
      bookContentEl.appendChild(imgEl);
    }
  }
});

function getImageExtension(book: any): string | null {
  const type = book.images.cover.t;
  switch (type) {
    case 'j':
      return '.jpg';
    case 'p':
      return '.png';
    default:
      return null;
  }
}

async function onDownload(url: string) {
  // Validate the url.
  if (url === '') throw new Error('URL is invalid.');

  // Get the book id.
  const bookId = url.match(/[0-9]/g).join('');
  if (bookId.length !== 6) throw new Error('Book ID is invalid.');

  // Fetch the book.
  const response = await fetch(`${BASE_API_URL}/${bookId}`);
  const book = await response.json();

  // Get the image extension.
  const imgExt = getImageExtension(book);
  if (imgExt === null) throw new Error('Cannot find image extension.');

  // Invoke the download function in the main process.
  await ipcRenderer.invoke('download', {
    payload: { book, imgExt },
  });
}

function buildDownloadBtn(downloadUrl: string) {
  const downloadBtnEl = document.createElement('span');
  downloadBtnEl.id = 'download-btn';
  downloadBtnEl.className = 'material-icons icon-button';
  downloadBtnEl.innerText = 'download';
  downloadBtnEl.addEventListener('click', () => onDownload(downloadUrl));
  return downloadBtnEl;
}
