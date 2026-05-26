import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

/**
 * PulseMate Logo — heart with pulse line
 * Pure React Native, no SVG dependency needed
 */
export default function Logo({ size = 'md', showText = true, light = false }) {
  const sizes = {
    sm: { container: 36, icon: 18, appName: 16, tagline: 10 },
    md: { container: 56, icon: 28, appName: 22, tagline: 12 },
    lg: { container: 80, icon: 40, appName: 30, tagline: 14 },
  };
  const s = sizes[size] || sizes.md;
  const textColor = light ? '#fff' : colors.text;
  const subColor  = light ? 'rgba(255,255,255,0.7)' : colors.textMuted;

  return (
    <View style={styles.wrap}>
      {/* Icon mark */}
      <View style={[
        styles.iconBox,
        { width: s.container, height: s.container, borderRadius: s.container * 0.28 },
      ]}>
        {/* Outer glow ring */}
        <View style={[styles.ring, { width: s.container + 8, height: s.container + 8, borderRadius: (s.container + 8) * 0.3 }]} />
        {/* Heart + pulse symbol */}
        <Text style={{ fontSize: s.icon, lineHeight: s.icon * 1.2 }}>🫀</Text>
      </View>

      {showText && (
        <View style={styles.textWrap}>
          <Text style={[styles.appName, { fontSize: s.appName, color: textColor }]}>
            Pulse<Text style={{ color: colors.primary }}>Mate</Text>
          </Text>
          {size !== 'sm' && (
            <Text style={[styles.tagline, { fontSize: s.tagline, color: subColor }]}>
              Your health, simplified
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox:  {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primaryMid,
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: colors.primaryMid,
    opacity: 0.4,
  },
  textWrap: { justifyContent: 'center' },
  appName:  { fontWeight: '800', letterSpacing: -0.5 },
  tagline:  { marginTop: 1, fontWeight: '500' },
});
