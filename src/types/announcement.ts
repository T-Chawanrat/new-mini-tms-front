export type AnnouncementMedia = {
  id: number;
  name: string;
  preview: string;
  mimeType: string;
  fileSize: number;
  displayOrder: number;
};

export type Announcement = {
  id: number;
  title: string;
  content: string;
  createdDate: string;
  isPinned: boolean;
  media: AnnouncementMedia[];
  imageUrls: string[];
};
