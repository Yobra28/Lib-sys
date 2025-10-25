export interface Fine {
  id: string;
  userId: string;
  borrowId: string;
  amount: number;
  reason: string;
  status: 'PENDING' | 'PAID' | 'WAIVED';
  paidDate?: string;
  waivedBy?: string;
  waivedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  borrow?: {
    id: string;
    bookId: string;
    borrowDate: string;
    dueDate: string;
    book?: {
      id: string;
      title: string;
      author: string;
      isbn: string;
    };
  };
}
