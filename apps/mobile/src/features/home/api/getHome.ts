import { HomeResponse } from '@libras/contracts';

import { mockHome } from './homeMocks';

// Long enough for the loading state to be visible on the device.
const mockLatencyMs = 600;

// Mocked until the BFF exposes GET /v1/home. Then only this function changes, to
// `apiRequest('/v1/home', HomeResponse)`; meanwhile the mock goes through the same schema.
export async function getHome(): Promise<HomeResponse> {
  await new Promise((resolve) => setTimeout(resolve, mockLatencyMs));
  return HomeResponse.parse(mockHome());
}
