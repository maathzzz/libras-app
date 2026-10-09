import { HomeResponse } from '@libras/contracts';

import { returningUserHome } from './homeMocks';

// Mocked until the BFF exposes GET /v1/home. Then this becomes
// `apiRequest('/v1/home', HomeResponse)`; the mock goes through the same schema meanwhile.
export async function fetchHome(): Promise<HomeResponse> {
  return HomeResponse.parse(returningUserHome);
}
