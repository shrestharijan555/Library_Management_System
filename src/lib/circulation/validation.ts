// src/lib/circulation/validation.ts
import { z } from "zod";

// Issue a loan: librarian provides copy ID and member code (library card)
export const issueLoanSchema = z.object({
  copyId: z.string().uuid("Invalid copy ID"),
  memberCode: z.string().min(1, "Member code is required").max(50, "Member code too long"),
});
export type IssueLoanInput = z.infer<typeof issueLoanSchema>;

// Return a loan (checkout desk)
export const returnLoanSchema = z.object({
  loanId: z.string().uuid("Invalid loan ID"),
});
export type ReturnLoanInput = z.infer<typeof returnLoanSchema>;

// Renew a loan
export const renewLoanSchema = z.object({
  loanId: z.string().uuid("Invalid loan ID"),
});
export type RenewLoanInput = z.infer<typeof renewLoanSchema>;

// Reserve a book (student or staff can reserve)
export const reserveBookSchema = z.object({
  bookId: z.string().uuid("Invalid book ID"),
  memberCode: z.string().min(1, "Member code is required").max(50, "Member code too long"),
});
export type ReserveBookInput = z.infer<typeof reserveBookSchema>;

// Cancel a reservation (librarian or owning member)
export const cancelReservationSchema = z.object({
  reservationId: z.string().uuid("Invalid reservation ID"),
});
export type CancelReservationInput = z.infer<typeof cancelReservationSchema>;

// Lookup a member by library card code
export const memberLookupSchema = z.object({
  memberCode: z.string().min(1, "Member code is required").max(50, "Member code too long"),
});
export type MemberLookupInput = z.infer<typeof memberLookupSchema>;
