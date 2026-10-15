// An expected business failure. It is returned inside a Result, never thrown, and its
// `code` reaches the app in the standard error body.
export class DomainError {
  constructor(
    readonly code: string,
    readonly message: string,
  ) {}
}
