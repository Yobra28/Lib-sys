/** Rotating copy shown after a student successfully reserves a seat. */

export const SEAT_RESERVATION_SUCCESS_TITLES = [
  'Seat reserved!',
  "You're booked in!",
  'Reservation confirmed',
  'Your spot is saved',
  'All set — see you there!',
] as const;

export const SEAT_RESERVATION_SUCCESS_LINES = [
  'Arrive on time; staff may release the seat if the slot passes.',
  'You can review or cancel this booking anytime under My Reservations below.',
  'Bring your student ID if the library checks reservations at the door.',
  'Need a different time? Cancel and pick another slot that works better.',
  'Thanks for using the seat booking system — enjoy your study session!',
] as const;

export function pickSeatReservationSuccessTitle(): string {
  const i = Math.floor(Math.random() * SEAT_RESERVATION_SUCCESS_TITLES.length);
  return SEAT_RESERVATION_SUCCESS_TITLES[i];
}

export function pickSeatReservationSuccessLine(): string {
  const i = Math.floor(Math.random() * SEAT_RESERVATION_SUCCESS_LINES.length);
  return SEAT_RESERVATION_SUCCESS_LINES[i];
}

/** After cancelling a reservation */
export const SEAT_RESERVATION_CANCEL_TITLES = [
  'Reservation cancelled',
  'Booking removed',
  'All clear',
  'Slot released',
] as const;

export const SEAT_RESERVATION_CANCEL_LINES = [
  'You can reserve another seat anytime from this page.',
  'Changed your mind? Pick a new date or time whenever you need.',
  'The seat is available again for other students in that time window.',
] as const;

export function pickSeatReservationCancelTitle(): string {
  return SEAT_RESERVATION_CANCEL_TITLES[
    Math.floor(Math.random() * SEAT_RESERVATION_CANCEL_TITLES.length)
  ];
}

export function pickSeatReservationCancelLine(): string {
  return SEAT_RESERVATION_CANCEL_LINES[
    Math.floor(Math.random() * SEAT_RESERVATION_CANCEL_LINES.length)
  ];
}
