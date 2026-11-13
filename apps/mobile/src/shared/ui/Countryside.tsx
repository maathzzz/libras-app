import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';

import { trailColors } from '@/shared/theme';

import { Cloud, Flower, Hill, SkyGradient, Tree } from './SceneryShapes';

type CountrysideProps = {
  /** Unique within the screen: it names the sky gradient. */
  id: string;
};

type Size = { width: number; height: number };

const [orange, white, teal, yellow] = trailColors.flowers;

// Sky turns into meadow this far down, unless the area is short.
const skyHeight = 230;

// Fixed backdrop of the game-like screens: the module map's sky and meadow, clouds at the
// top and hills with trees in the bottom corners. It fills its parent and stays put while
// the content scrolls over it. Drawn once its size is known.
export function Countryside({ id }: CountrysideProps) {
  const [size, setSize] = useState<Size | null>(null);

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.fill}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize({ width, height });
      }}
    >
      {size && (
        <Svg width={size.width} height={size.height}>
          <Scene id={id} {...size} />
        </Svg>
      )}
    </View>
  );
}

function Scene({ id, width: w, height: h }: Size & { id: string }) {
  return (
    <>
      <SkyGradient id={id} width={w} height={h} skyHeight={Math.min(skyHeight, h * 0.4)} />
      <Cloud x={w - 52} y={44} scale={1} />
      <Cloud x={w - 154} y={22} scale={0.7} />
      <Cloud x={40} y={150} scale={0.8} />

      <Hill cx={w + 30} cy={h - 110} rx={110} ry={84} />
      <Hill cx={w + 10} cy={h - 80} rx={70} ry={48} inner />
      <Hill cx={-30} cy={h - 30} rx={120} ry={90} />
      <Hill cx={-10} cy={h} rx={86} ry={56} inner />

      <Tree x={w - 30} y={h - 214} scale={0.9} />
      <Tree x={w - 62} y={h - 150} scale={0.7} />
      <Tree x={34} y={h - 150} scale={1} />
      <Tree x={78} y={h - 92} scale={0.75} />

      <Flower x={20} y={h - 210} color={teal} />
      <Flower x={w - 40} y={h - 60} color={yellow} />
      <Flower x={110} y={h - 40} color={orange} />
      <Flower x={w - 26} y={h - 270} color={white} />
    </>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: trailColors.meadow,
  },
});
