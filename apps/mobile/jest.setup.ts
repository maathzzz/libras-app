// react-native-mmkv uses an in-memory store under Jest, but still imports the Nitro
// native module, which only exists in a real build.
jest.mock('react-native-nitro-modules', () => ({ NitroModules: {} }));

// Reanimated 4 runs in Jest through react-native-worklets' resolver (package.json
// "jest.resolver"), which picks the JS implementation of the worklets runtime.
