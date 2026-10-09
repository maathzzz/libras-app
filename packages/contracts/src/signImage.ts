import { z } from 'zod';

// `url` is not restricted to http(s): alphabet and number images are bundled in the app.
export const SignImage = z.object({
  url: z.string().min(1),
  alt: z.string().min(1),
});
export type SignImage = z.infer<typeof SignImage>;

// A sign with movement is shown as its frames in order.
export const SignImageSequence = z.array(SignImage).min(1);
export type SignImageSequence = z.infer<typeof SignImageSequence>;
