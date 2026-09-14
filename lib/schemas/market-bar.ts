import { z } from "zod";

/**
 * One validated daily OHLC bar.
 * `date` is a trading-session calendar day (YYYY-MM-DD), never a timestamp.
 */
export const MarketBarSchema = z
  .strictObject({
    date: z.iso.date(),
    open: z.number().finite().positive(),
    high: z.number().finite().positive(),
    low: z.number().finite().positive(),
    close: z.number().finite().positive(),
  })
  .superRefine((bar, ctx) => {
    if (bar.high < bar.open) {
      ctx.addIssue({
        code: "custom",
        path: ["high"],
        message: `high (${bar.high}) must be >= open (${bar.open})`,
      });
    }
    if (bar.high < bar.close) {
      ctx.addIssue({
        code: "custom",
        path: ["high"],
        message: `high (${bar.high}) must be >= close (${bar.close})`,
      });
    }
    if (bar.high < bar.low) {
      ctx.addIssue({
        code: "custom",
        path: ["high"],
        message: `high (${bar.high}) must be >= low (${bar.low})`,
      });
    }
    if (bar.low > bar.open) {
      ctx.addIssue({
        code: "custom",
        path: ["low"],
        message: `low (${bar.low}) must be <= open (${bar.open})`,
      });
    }
    if (bar.low > bar.close) {
      ctx.addIssue({
        code: "custom",
        path: ["low"],
        message: `low (${bar.low}) must be <= close (${bar.close})`,
      });
    }
  });

export type MarketBar = z.infer<typeof MarketBarSchema>;

export function parseMarketBar(input: unknown): MarketBar {
  return MarketBarSchema.parse(input);
}

export function safeParseMarketBar(input: unknown) {
  return MarketBarSchema.safeParse(input);
}
