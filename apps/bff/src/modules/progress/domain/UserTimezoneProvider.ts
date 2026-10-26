// Port to the profile: the streak's "day" is the local date in the learner's IANA zone.
// Every profile has a zone, so there is no "not found" case here.
export interface UserTimezoneProvider {
  timezoneOf(userId: string): Promise<string>;
}
