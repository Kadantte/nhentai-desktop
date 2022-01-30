interface DownloadFile {
  url: string;
  filePath: string;
}

interface BookImage {
  t: string;
  w: number;
  h: number;
}

interface BookTag {
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
    pages: BookImage[];
    cover: BookImage;
    thumbnail: BookImage;
  };
  scanlator: string;
  upload_date: number;
  tags: BookTag[];
  num_pages: number;
  num_favorites: number;
}
