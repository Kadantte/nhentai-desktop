interface DownloadFile {
  url: string;
  filePath: string;
}

interface Page {
  t: string;
  w: number;
  h: number;
}

interface Tag {
  id: number;
  type: string;
  name: string;
  url: string;
  count: number;
}

interface Book {
  id: number;
  media_id: string;
  title: {
    english: string;
    japanese: string;
    pretty: string;
  };
  images: {
    pages: Page[];
    cover: Page;
    thumbnail: Page;
  };
  scanlator: string;
  upload_date: number;
  tags: Tag[];
  num_pages: number;
  num_favorites: number;
}
