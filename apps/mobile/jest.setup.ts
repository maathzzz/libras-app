// The device's date (shared/lib/localDate) depends on the zone: a fixed one behind UTC
// makes the tests the same on any machine and catches a UTC date taken by mistake.
process.env.TZ = 'America/Sao_Paulo';

// shared/api/client reads it when the module loads; tests mock fetch, nothing goes out.
process.env.EXPO_PUBLIC_API_URL ??= 'https://bff.test';

// react-native-mmkv uses an in-memory store under Jest, but still imports the Nitro
// native module, which only exists in a real build.
jest.mock('react-native-nitro-modules', () => ({ NitroModules: {} }));

// Reanimated 4 runs in Jest through react-native-worklets' resolver (package.json
// "jest.resolver"), which picks the JS implementation of the worklets runtime.
