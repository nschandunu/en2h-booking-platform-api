import { BookingStatus } from '@prisma/client';

export class BookingStatusValidator {
  private static readonly ALLOWED_TRANSITIONS: Record<
    BookingStatus,
    BookingStatus[]
  > = {
    [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
    [BookingStatus.CONFIRMED]: [
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED,
    ],
    [BookingStatus.COMPLETED]: [],
    [BookingStatus.CANCELLED]: [],
  };

  /**
   * Determines if a booking can transition from its current status to a new status.
   *
   * @param currentStatus The current status of the booking.
   * @param newStatus The proposed new status of the booking.
   * @returns true if the transition is allowed, false otherwise.
   */
  public static canTransition(
    currentStatus: BookingStatus,
    newStatus: BookingStatus,
  ): boolean {
    if (currentStatus === newStatus) {
      return true; // Optionally allow staying in the same state, or return false if strictly requiring change
    }

    const allowedTransitions = this.ALLOWED_TRANSITIONS[currentStatus];
    return allowedTransitions.includes(newStatus);
  }
}
