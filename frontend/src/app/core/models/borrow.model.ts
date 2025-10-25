export interface Borrow {
  id: string;
  userId: string;
  bookId: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE';
  renewalCount: number;
  createdAt: string;
  updatedAt: string;
  book?: {
    id: string;
    title: string;
    author: string;
    isbn: string;
    category: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  fines?: Fine[];
}

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
}
