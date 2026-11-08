// Metro turns an imported image into the asset id that expo-image accepts as `source`.
declare module '*.webp' {
  const source: number;
  export default source;
}
