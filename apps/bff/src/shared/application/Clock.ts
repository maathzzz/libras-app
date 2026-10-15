// Source of the current time. Domain and use cases ask the Clock instead of calling
// `new Date()`, so tests can pin "now" to any instant.
export interface Clock {
  now(): Date;
}
