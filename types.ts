export type VideoCategory = 'Botany' | 'Zoology' | 'NCERT line by line' | 'Other';

export interface VideoData {
  id: string;
  title: string;
  category: VideoCategory;
  blob: Blob;
  thumbnailUrl: string;
  createdAt: number;
  duration: number;
}

export interface VideoMetadata {
  id: string;
  title: string;
  category: VideoCategory;
  thumbnailUrl: string;
  createdAt: number;
  duration: number;
}

export enum ViewState {
  HOME = 'HOME',
  PLAYER = 'PLAYER',
  ADMIN = 'ADMIN',
}

export interface UploadStatus {
  state: 'idle' | 'processing' | 'success' | 'error';
  message?: string;
}