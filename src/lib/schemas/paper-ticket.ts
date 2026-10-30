// Zod 4 schema for the Den's paper-trade ticket form (Phase 0, paper only).
// Mirrors the validation rules table in docs/redesign/notes/paper-ticket-validation.md.
// This is the SERVER-SIDE gate; the HTML `required` attribute is UX only.
import { z } from "zod";

export const paperTicketSchema = z.object({
  // Coin ticker, e.g. BTC, ETH. Uppercase letters/digits, 2-8 chars.
  symbol: z
    .string({ message: "Symbol is required." })
    .trim()
    .min(2, "Symbol is required and must be at least 2 characters.")
    .max(8, "Symbol must be 8 characters or fewer.")
    .regex(/^[A-Z0-9]+$/, "Symbol must be uppercase letters/digits only (e.g. BTC)."),

  // Direction of the paper position.
  side: z.enum(["long", "short"], {
    message: "Pick a side: long or short.",
  }),

  // Paper notional in USD.
  notionalUsd: z
    .number({ message: "Notional must be a number." })
    .min(1, "Notional must be at least $1.")
    .max(10000, "Notional must be $10,000 or less (Phase 0 cap).")
    .refine((v) => Number.isFinite(v), "Notional must be a finite number."),

  // Phase 0 leverage cap: 1x or 2x (1.5x allowed as midpoint).
  leverage: z
    .number({ message: "Leverage is required." })
    .min(1, "Leverage must be at least 1×.")
    .max(2, "Leverage must be 2× or less (Phase 0 cap).")
    .refine((v) => v === 1 || v === 1.5 || v === 2, "Leverage must be 1×, 1.5×, or 2×."),

  // Hold window in hours; must be a multiple of 8, between 8 and 168.
  holdHours: z
    .number({ message: "Hold window is required." })
    .min(8, "Hold must be at least 8 hours.")
    .max(168, "Hold must be 168 hours (7 days) or fewer.")
    .refine((v) => v % 8 === 0, "Hold must be a multiple of 8 hours."),

  // Optional free-text note.
  note: z
    .string()
    .max(140, "Note must be 140 characters or fewer.")
    .optional()
    .or(z.literal("")),

  // Checkbox: must be explicitly ticked to acknowledge paper-only.
  confirmPaper: z
    .boolean({ message: "You must confirm this is a paper trade." })
    .refine((v) => v === true, "You must confirm this is a paper trade (Phase 0 — no real orders)."),
});

export type PaperTicket = z.infer<typeof paperTicketSchema>;
