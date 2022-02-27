import { ipcRenderer } from 'electron';

import { BASE_API_URL, BASE_IMG_URL } from '../src/config.json';

// Load more <expandCnt> images when expand.
const expandCnt = 10;
const urlRegex = RegExp('https://nhentai.net/g/[0-9]+/');

// Image URL stack.
var imgUrlStack: string[] = [];

window.addEventListener('DOMContentLoaded', () => {
  const mainEl = document.getElementById('main');
  const bookUrlEl = document.getElementById('book-url');
  const fetchBtnEl = document.getElementById('fetch-btn');
  const toTopBtnEl = document.getElementById('to-top-btn');

  // Scroll to top.
  toTopBtnEl.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // On fetch.
  fetchBtnEl.addEventListener('click', async () => {
    try {
      // Grab the url.
      const url = (<HTMLInputElement>bookUrlEl).value;

      // Validate the url.
      if (!urlRegex.test(url)) {
        return ipcRenderer.send('notify', { msg: 'The URL is invalid.' });
      }

      // Fetch the book.
      const res = await fetch(`${BASE_API_URL}/${getBookId(url)}`);

      if (res.status !== 200) {
        return ipcRenderer.send('notify', {
          msg: `Could not fetch the book. (Status: ${res.status})`,
        });
      }

      const book: Book = await res.json();

      // Clear the book.
      mainEl.innerHTML = '';
      toTopBtnEl.hidden = true;

      // Insert the book info.
      const bookInfoEl = buildBookInfoEl(book);
      bookInfoEl.appendChild(buildDownloadBtnEl(book));
      mainEl.appendChild(bookInfoEl);

      // Build a url stack from the book.
      imgUrlStack = buildImgUrlStack(book);

      // Insert the book content.
      const bookContentEl = buildBookContentEl(book);
      mainEl.appendChild(bookContentEl);

      // Insert the expand button.
      if (imgUrlStack.length > 0) {
        const expandBtnEl = buildExpandButtonEl();
        expandBtnEl.addEventListener('click', () => {
          bookContentEl.innerHTML += buildExpandContentEl().innerHTML;
        });
        mainEl.appendChild(expandBtnEl);
      }

      toTopBtnEl.hidden = false;
    } catch (err) {
      console.error(err);
      ipcRenderer.send('notify', { msg: `Something went wrong.` });
    }
  });
});

function getBookId(url: string) {
  return url.match(/[0-9]/g).join('');
}

function buildDownloadBtnEl(book: Book) {
  const downloadBtnEl = document.createElement('button');
  downloadBtnEl.id = 'download-btn';
  downloadBtnEl.className = 'icon-btn';
  downloadBtnEl.appendChild(document.getElementById('download-icon').cloneNode(true));

  // On download.
  downloadBtnEl.addEventListener('click', async () => {
    // Invoke the download function in the main process.
    await ipcRenderer.invoke('download', {
      payload: { book },
    });
  });

  return downloadBtnEl;
}

function buildBookInfoEl(book: Book) {
  const bookInfoEl = document.createElement('div');
  bookInfoEl.id = 'book-info';

  const bookTitleEl = document.createElement('div');
  bookTitleEl.id = 'book-title';
  bookTitleEl.innerText = book.title.english;

  const bookPageCntEl = document.createElement('div');
  bookPageCntEl.innerText = book.num_pages + ' Pages';

  bookInfoEl.appendChild(bookTitleEl);
  bookInfoEl.appendChild(bookPageCntEl);

  return bookInfoEl;
}

function buildBookContentEl(book: Book) {
  const bookContentEl = document.createElement('div');
  bookContentEl.id = 'book-content';

  // Insert <expandCnt> images.
  bookContentEl.innerHTML += buildExpandContentEl().innerHTML;

  return bookContentEl;
}

function buildImgUrlStack(book: Book) {
  return book.images.pages
    .map((page, index) => {
      const imgExt = page.t === 'j' ? '.jpg' : '.png';
      return `${BASE_IMG_URL}/${book.media_id}/${index + 1}${imgExt}`;
    })
    .reverse();
}

function buildImgEl(url: string) {
  const imgEl = document.createElement('img');
  imgEl.id = 'book-img';
  imgEl.src = url;
  return imgEl;
}

function buildExpandContentEl() {
  const buffer = document.createElement('div');

  for (var i = 0; i < expandCnt && imgUrlStack.length > 0; i++) {
    buffer.appendChild(buildImgEl(imgUrlStack.pop()));
  }

  if (imgUrlStack.length <= 0) {
    // Delete the expand button.
    const expandBtnEl = document.getElementById('expand-btn');
    if (expandBtnEl) {
      expandBtnEl.remove();
    }
  }

  return buffer;
}

function buildExpandButtonEl() {
  const expandBtnEl = document.createElement('button');
  expandBtnEl.id = 'expand-btn';
  expandBtnEl.className = 'icon-btn';
  expandBtnEl.appendChild(document.getElementById('expand-icon').cloneNode(true));
  return expandBtnEl;
}
