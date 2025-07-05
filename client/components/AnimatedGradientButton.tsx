import React, { useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const suggestionGradientA = ['#A6BFFF', '#D1B3FF', '#F3E8FF'];
const suggestionGradientB = ['#B7E0FF', '#C6B8FF', '#F9EFFF'];

const AnimatedGradientButton = ({
  suggestionGradientAnim,
  pressed,
  children,
}: {
  suggestionGradientAnim: Animated.Value;
  pressed: boolean;
  children: React.ReactNode;
}) => {
  const [gradientColors, setGradientColors] = useState(suggestionGradientA);

  useEffect(() => {
    const id = suggestionGradientAnim.addListener(({ value }) => {
      try {
        const a = suggestionGradientA;
        const b = suggestionGradientB;
        const lerp = (start: number, end: number, t: number) => Math.round(start + (end - start) * t);
        const hexToRgb = (hex: string) => {
          const h = hex.replace('#', '');
          return [
            parseInt(h.substring(0, 2), 16),
            parseInt(h.substring(2, 4), 16),
            parseInt(h.substring(4, 6), 16),
          ];
        };
        const rgbToHex = (rgb: number[]) =>
          '#' + rgb.map(x => x.toString(16).padStart(2, '0')).join('');
        const colors = a.map((color, i) => {
          const rgbA = hexToRgb(a[i]);
          const rgbB = hexToRgb(b[i]);
          return rgbToHex([
            lerp(rgbA[0], rgbB[0], value),
            lerp(rgbA[1], rgbB[1], value),
            lerp(rgbA[2], rgbB[2], value),
          ]);
        });
        setGradientColors(colors);
      } catch {
        setGradientColors(suggestionGradientA);
      }
    });
    return () => suggestionGradientAnim.removeListener(id);
  }, [suggestionGradientAnim]);

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', justifyContent: 'center', minWidth: 320 },
        pressed && { opacity: 0.85 },
      ]}
    >
      {children}
    </LinearGradient>
  );
};

export default AnimatedGradientButton;
