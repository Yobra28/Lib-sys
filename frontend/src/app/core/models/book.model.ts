export enum BookStatus {
  AVAILABLE = 'AVAILABLE',
  BORROWED = 'BORROWED',
  RESERVED = 'RESERVED',
  MAINTENANCE = 'MAINTENANCE'
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  publishedYear?: number;
  totalCopies: number;
  availableCopies: number;
  status: BookStatus | string;
  // Optional cover image fields (backend may use different names)
  coverImageUrl?: string;
  coverUrl?: string;
  imageUrl?: string;
  thumbnail?: string;
  createdAt?: string;
  updatedAt?: string;
}
