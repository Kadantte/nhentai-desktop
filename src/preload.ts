import { ipcRenderer } from 'electron';

const { BASE_API_URL, BASE_IMG_URL } = require('../src/config.json');

// Expand button.
const expandBtnEl = buildExpandBtnEl();

// Expand more <expandCnt> images each time.
const expandCnt = 10;

// Image element stack.
var imgUrlStack: string[] = [];

window.addEventListener('DOMContentLoaded', () => {
  const btnSlotEl = document.getElementById('btn-slot');
  const bookUrlEl = document.getElementById('book-url');
  const fetchBtnEl = document.getElementById('fetch-btn');
  const bookTitleEl = document.getElementById('book-title');
  const bookContentEl = document.getElementById('book-content');
  const bookPageCntEl = document.getElementById('book-page-cnt');
  const expandBtnSlotEl = document.getElementById('expand-btn-slot');

  fetchBtnEl.addEventListener('click', onFetch);
  expandBtnEl.addEventListener('click', onExpand);

  async function onFetch(e: SubmitEvent): Promise<void> {
    e.preventDefault();

    // Grab the url.
    const url = (<HTMLInputElement>bookUrlEl).value;
    if (url === '') throw new Error('URL is invalid.');

    // Fetch the book.
    const response = await fetch(`${BASE_API_URL}/${getBookId(url)}`);
    const book: Book = await response.json();

    // Update the book info.
    clearBookInfo();
    bookTitleEl.innerHTML = book.title.english;
    bookPageCntEl.innerHTML = book.num_pages + ' Pages';
    btnSlotEl.appendChild(buildDownloadBtnEl(url));

    // Build a url stack from the book.
    imgUrlStack = book.images.pages
      .map((page, index) => {
        const imgExt = page.t === 'j' ? '.jpg' : '.png';
        return `${BASE_IMG_URL}/${book.media_id}/${index + 1}${imgExt}`;
      })
      .reverse();

    // Insert <expandCnt> images.
    onExpand();

    // Insert the expand button.
    expandBtnSlotEl.appendChild(expandBtnEl);
  }

  // Pop <num> elements from the stack and insert them to the dom.
  function onExpand() {
    const buffer = document.createElement('div');
    for (var i = 0; i < expandCnt && imgUrlStack.length > 0; i++) {
      const imgEl = document.createElement('img');
      imgEl.src = imgUrlStack.pop();
      buffer.appendChild(imgEl);
    }
    bookContentEl.innerHTML += buffer.innerHTML;

    // Remove the expand button if the stack is empty.
    if (imgUrlStack.length === 0) {
      expandBtnSlotEl.innerHTML = '';
    }
  }
});

async function onDownload(url: string) {
  if (url === '') throw new Error('URL is invalid.');

  // Fetch the book.
  const response = await fetch(`${BASE_API_URL}/${getBookId(url)}`);
  const book: Book = await response.json();

  // Invoke the download function in the main process.
  await ipcRenderer.invoke('download', {
    payload: { book },
  });
}

function buildDownloadBtnEl(url: string) {
  const downloadBtnEl = document.createElement('span');
  downloadBtnEl.id = 'download-btn';
  downloadBtnEl.className = 'material-icons icon-button';
  downloadBtnEl.innerText = 'download';
  downloadBtnEl.addEventListener('click', () => onDownload(url));
  return downloadBtnEl;
}

function buildExpandBtnEl() {
  const expandBtnEl = document.createElement('span');
  expandBtnEl.id = 'expand-btn';
  expandBtnEl.className = 'material-icons icon-button';
  expandBtnEl.innerText = 'expand_more';
  return expandBtnEl;
}

function clearBookInfo() {
  // Clear the image element stack.
  imgUrlStack = [];

  // Clear the HTML elements.
  const mainEl = document.getElementById('main');
  for (var i = 0; i < mainEl.children.length; i++) {
    mainEl.children.item(i).innerHTML = '';
  }
}

function getBookId(url: string) {
  return url.match(/[0-9]/g).join('');
}
