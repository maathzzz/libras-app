// A client error raised by the HTTP layer itself (missing token, bad header), before any use
// case runs. The error handler answers it with its own status and code.
export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
