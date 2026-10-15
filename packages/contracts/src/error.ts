import { z } from 'zod';

// Body of every non-2xx response from the BFF. `code` is stable and meant for the app
// to branch on; `message` is for logs and debugging.
export const ErrorResponse = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string(),
  }),
});
export type ErrorResponse = z.infer<typeof ErrorResponse>;
