/** Rotating copy shown after a student successfully borrows a book. */

export const BORROW_SUCCESS_TITLES = [
  "You're all set!",
  'Happy reading!',
  'Enjoy your book!',
  'Borrow confirmed',
  'Great choice!',
] as const;

export const BORROW_SUCCESS_LINES = [
  'Return or renew on time — overdue fines are KES 1 per day.',
  'You can check due dates anytime under My Borrows.',
  'Need more time? Renew before the due date if your library allows it.',
  'Please keep the book in good shape for the next reader.',
  'Thanks for using the library — we hope you love this title!',
] as const;

export function pickBorrowSuccessTitle(): string {
  const i = Math.floor(Math.random() * BORROW_SUCCESS_TITLES.length);
  return BORROW_SUCCESS_TITLES[i];
}

export function pickBorrowSuccessLine(): string {
  const i = Math.floor(Math.random() * BORROW_SUCCESS_LINES.length);
  return BORROW_SUCCESS_LINES[i];
}
