// ─────────────────────────────────────────────────────────────────────────────
//  Logo — PulseMate Connect  |  Real image logo component
// ─────────────────────────────────────────────────────────────────────────────
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../theme';

const LOGO = require('../../assets/logo1.jpeg');

/**
 * PulseMate Logo — uses the real logo1.jpeg asset
 * Props:
 *   size      — 'sm' | 'md' | 'lg' | 'xl'  (default: 'md')
 *   showText  — show app name beside logo    (default: true)
 *   light     — white text for dark bg       (default: false)
 *   tagline   — show tagline below name      (default: false)
 */
export default function Logo({ size = 'md', showText = true, light = false, tagline = false }) {
  const cfg = {
    sm: { img: 32,  radius: 9,  name: 15, sub: 10 },
    md: { img: 44,  radius: 13, name: 20, sub: 11 },
    lg: { img: 60,  radius: 18, name: 26, sub: 13 },
    xl: { img: 80,  radius: 22, name: 32, sub: 14 },
  }[size] || { img: 44, radius: 13, name: 20, sub: 11 };

  const nameColor = light ? '#FFFFFF' : colors.text;
  const subColor  = light ? 'rgba(255,255,255,0.7)' : colors.textMuted;

  return (
    <View style={s.wrap}>
      {/* Logo image */}
      <Image
        source={LOGO}
        style={[s.img, { width: cfg.img, height: cfg.img, borderRadius: cfg.radius }]}
        resizeMode="cover"
      />

      {showText && (
        <View style={s.textWrap}>
          <Text style={[s.name, { fontSize: cfg.name, color: nameColor }]}>
            Pulse<Text style={{ color: colors.primary }}>Mate</Text>
          </Text>
          {tagline && (
            <Text style={[s.tagline, { fontSize: cfg.sub, color: subColor }]}>
              Smart healthcare at your fingertips
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  img:     {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  textWrap:{ justifyContent: 'center' },
  name:    { fontWeight: '800', letterSpacing: -0.5, lineHeight: undefined },
  tagline: { marginTop: 2, fontWeight: '500', lineHeight: 15 },
});
