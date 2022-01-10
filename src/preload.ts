import { ipcRenderer } from 'electron';

const galleryUrl = 'https://i.nhentai.net/galleries';

window.addEventListener('DOMContentLoaded', () => {
  const itemUrlEl = document.getElementById('item-url');
  const fetchBtnEl = document.getElementById('fetch-btn');
  const itemTitleEl = document.getElementById('item-title');
  const downloadBtn = document.getElementById('download-btn');
  const itemContentEl = document.getElementById('item-content');

  fetchBtnEl.addEventListener('click', onFetch);
  downloadBtn.addEventListener('click', onDownload);

  async function onDownload() {
    // Prepare the data.
    const url = (<HTMLInputElement>itemUrlEl).value;
    if (url === '') throw new Error('URL is invalid.');
    const itemDoc = await getItemDoc(url);
    const itemData = await getItemData(itemDoc);
    const imgExt = getImageExtension(itemData);
    if (imgExt === null) throw new Error('Cannot find the image extension.');

    // Invoke the download function in the main process.
    await ipcRenderer.invoke('download', {
      payload: { itemData, galleryUrl, imgExt },
    });
  }

  async function onFetch(e: SubmitEvent): Promise<void> {
    e.preventDefault();

    // Prepare the data.
    const url = (<HTMLInputElement>itemUrlEl).value;
    if (url === '') throw new Error('URL is invalid.');
    const itemDoc = await getItemDoc(url);
    itemContentEl.innerHTML = '';
    const itemData = await getItemData(itemDoc);
    const imgExt = getImageExtension(itemData);
    if (imgExt === null) throw new Error('Cannot find image extension.');
    const itemTitle = itemData.title.english;
    itemTitleEl.innerHTML = itemTitle;

    // Fetch the images.
    for (var i = 1; i <= itemData.num_pages; i++) {
      const imgEl = document.createElement('img');
      imgEl.src = `${galleryUrl}/${itemData.media_id}/${i}${imgExt}`;
      imgEl.alt = `Image ${i}`;
      itemContentEl.appendChild(imgEl);
    }
  }
});

async function getItemDoc(url: string): Promise<Document> {
  const response = await fetch(url);
  const content = await response.text();
  const parser = new DOMParser();
  return parser.parseFromString(content, 'text/html');
}

async function getItemData(itemDoc: Document) {
  const scripContent = itemDoc.getElementsByTagName('script')[2].innerText;
  const leftQuote = scripContent.indexOf('"');
  const rightQuote = scripContent.indexOf('"', leftQuote + 1);
  const jsonString = scripContent.slice(leftQuote, rightQuote + 1);
  return JSON.parse(JSON.parse(jsonString));
}

function getImageExtension(itemData: any): string | null {
  const type = itemData.images.cover.t;
  if (type === 'j') return '.jpg';
  else if (type === 'p') return '.png';
  else return null;
}
