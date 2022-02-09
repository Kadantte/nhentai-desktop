import { ipcRenderer } from 'electron';

const { BASE_API_URL, BASE_IMG_URL } = require('../src/config.json');

// Load more <expandCnt> images when expand.
const expandCnt = 10;

// Image URL stack.
var imgUrlStack: string[] = [];

window.addEventListener('DOMContentLoaded', () => {
  const mainEl = document.getElementById('main');
  const bookUrlEl = document.getElementById('book-url');
  const fetchBtnEl = document.getElementById('fetch-btn');
  const toTopBtnEl = document.getElementById('to-top-btn');

  fetchBtnEl.addEventListener('click', onFetch);
  toTopBtnEl.addEventListener('click', scrollToTop);

  async function onFetch(e: SubmitEvent): Promise<void> {
    e.preventDefault();

    // Grab the url.
    const url = (<HTMLInputElement>bookUrlEl).value;
    if (url === '') throw new Error('URL is invalid.');

    // Fetch the book.
    const book = await fetchBook(url);

    // Clear the book.
    mainEl.innerHTML = '';
    toTopBtnEl.hidden = true;

    // Insert the book info.
    const bookInfoEl = buildBookInfoEl(book);
    bookInfoEl.appendChild(buildDownloadBtnEl(url));
    mainEl.appendChild(bookInfoEl);

    // Build a url stack from the book.
    imgUrlStack = buildImgUrlStack(book);

    // Insert the book content.
    const bookContentEl = buildBookContentEl(book);
    mainEl.appendChild(bookContentEl);

    // Insert the expand button.
    const expandBtnEl = buildExpandButtonEl();
    expandBtnEl.addEventListener('click', () => {
      bookContentEl.innerHTML += buildExpandContentEl().innerHTML;
    });
    mainEl.appendChild(expandBtnEl);

    toTopBtnEl.hidden = false;
  }
});

async function onDownload(url: string) {
  // Fetch the book.
  const book = await fetchBook(url);

  // Invoke the download function in the main process.
  await ipcRenderer.invoke('download', {
    payload: { book },
  });
}

async function fetchBook(url: string) {
  const response = await fetch(`${BASE_API_URL}/${getBookId(url)}`);
  return (await response.json()) as Book;
}

function getBookId(url: string) {
  return url.match(/[0-9]/g).join('');
}

function buildDownloadBtnEl(url: string) {
  const downloadBtnEl = document.createElement('button');
  downloadBtnEl.id = 'download-btn';
  downloadBtnEl.className = 'icon-btn';
  downloadBtnEl.appendChild(document.getElementById('download-icon').cloneNode(true));
  downloadBtnEl.addEventListener('click', () => onDownload(url));
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
    document.getElementById('expand-btn').remove();
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

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
