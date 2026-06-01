// ─────────────────────────────────────────────────────────────────────────────
//  PulseMate Connect — App Entry + Premium Splash Screen
// ─────────────────────────────────────────────────────────────────────────────
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {
  View, Text, Image, StyleSheet, Animated, Easing, Dimensions, StatusBar,
} from 'react-native';
import { useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './src/store/authStore';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import { colors } from './src/theme';

const { width: W, height: H } = Dimensions.get('window');
const LOGO = require('./assets/logo1.jpeg');

// Brand tokens
const SKY4 = '#38BDF8';
const SKY5 = '#0EA5E9';
const SKY7 = '#0369A1';
const SKY9 = '#0C4A6E';
const TEAL = '#2DD4BF';
const ROSE = '#FB7185';
const WHITE = '#FFFFFF';

// ─── Ripple ring ──────────────────────────────────────────────────────────────
function Ring({ size, delay, color }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(a, { toValue: 1, duration: 2400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(a, { toValue: 0, duration: 0, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <Animated.View style={{
      position: 'absolute',
      width: size, height: size, borderRadius: size / 2,
      borderWidth: 1.5, borderColor: color,
      opacity: a.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.4, 0] }),
      transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) }],
    }} />
  );
}

// ─── Floating particle ────────────────────────────────────────────────────────
function Particle({ x, y, label, delay }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(a, { toValue: 1, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(a, { toValue: 0, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <Animated.View style={{
      position: 'absolute', left: x, top: y,
      opacity: a.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 0.6, 0.6, 0] }),
      transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, -16] }) }],
    }}>
      <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }}>{label}</Text>
    </Animated.View>
  );
}

// ─── ECG heartbeat line ───────────────────────────────────────────────────────
function EcgLine({ progress }) {
  const pts = [[0,0],[10,0],[16,0],[20,-30],[25,24],[29,-20],[33,0],[45,0],[49,-8],[53,0],[65,0],[69,-5],[73,0],[100,0]];
  const LW = W * 0.74;
  const MY = 24;
  const clipW = progress.interpolate({ inputRange: [0, 1], outputRange: [0, LW] });

  const segs = pts.map(([x, y], i) => {
    if (i === 0) return null;
    const [px, py] = pts[i - 1];
    const dx = ((x - px) / 100) * LW;
    const dy = y - py;
    const len = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return { i, px, py, len, angle };
  }).filter(Boolean);

  return (
    <View style={{ width: LW, height: 56 }}>
      {/* Dim ghost track */}
      {segs.map(({ i, px, py, len, angle }) => (
        <View key={i} style={{
          position: 'absolute',
          left: (pts[i - 1][0] / 100) * LW, top: MY + pts[i - 1][1],
          width: len, height: 2, borderRadius: 1,
          backgroundColor: 'rgba(255,255,255,0.15)',
          transform: [{ rotate: `${angle}deg` }],
        }} />
      ))}
      {/* Glowing reveal clip */}
      <Animated.View style={{ position: 'absolute', width: clipW, height: 56, overflow: 'hidden' }}>
        {segs.map(({ i, px, py, len, angle }) => (
          <View key={i} style={{
            position: 'absolute',
            left: (pts[i - 1][0] / 100) * LW, top: MY + pts[i - 1][1],
            width: len, height: 2.5, borderRadius: 2,
            backgroundColor: SKY4,
            shadowColor: SKY4, shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1, shadowRadius: 6,
            transform: [{ rotate: `${angle}deg` }],
          }} />
        ))}
      </Animated.View>
      {/* Travelling glow dot */}
      <Animated.View style={{
        position: 'absolute', top: MY - 5, left: clipW,
        width: 10, height: 10, borderRadius: 5, marginLeft: -5,
        backgroundColor: WHITE,
        shadowColor: SKY4, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1, shadowRadius: 10,
      }} />
    </View>
  );
}

// ─── Logo mark: real image + ripple rings ────────────────────────────────────
function LogoMark({ pulse }) {
  const sc  = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.06, 1] });
  const glo = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.15, 0.45, 0.15] });
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 30 }}>
      {/* Ripple rings */}
      <Ring size={210} delay={0}    color={SKY4} />
      <Ring size={168} delay={700}  color={SKY5} />
      <Ring size={126} delay={1400} color={TEAL} />
      {/* Glow halo behind logo */}
      <Animated.View style={{
        position: 'absolute', width: 124, height: 124, borderRadius: 62,
        backgroundColor: SKY4, opacity: glo,
      }} />
      {/* Real logo image — animated scale pulse */}
      <Animated.View style={[sp.logoWrap, { transform: [{ scale: sc }] }]}>
        <Image source={LOGO} style={sp.logoImg} resizeMode="cover" />
      </Animated.View>
    </View>
  );
}

// ─── Main SplashScreen ────────────────────────────────────────────────────────
function SplashScreen() {
  const enter   = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(36)).current;
  const tagA    = useRef(new Animated.Value(0)).current;
  const ecgA    = useRef(new Animated.Value(0)).current;
  const barA    = useRef(new Animated.Value(0)).current;
  const badgeA  = useRef(new Animated.Value(0)).current;
  const pulse   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.timing(enter,  { toValue: 1, duration: 650, delay: 150, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideY, { toValue: 0, duration: 650, delay: 150, easing: Easing.out(Easing.back(1.6)), useNativeDriver: true }),
    ]).start();
    // Badge pop
    Animated.spring(badgeA, { toValue: 1, delay: 550, friction: 5, tension: 90, useNativeDriver: true }).start();
    // Tagline
    Animated.timing(tagA, { toValue: 1, duration: 500, delay: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    // ECG sweep (non-native for width)
    Animated.timing(ecgA, { toValue: 1, duration: 2000, delay: 900, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start();
    // Loading bar
    Animated.timing(barA, { toValue: 1, duration: 2200, delay: 800, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start();
    // Heartbeat pulse loop
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []);

  return (
    <View style={sp.root}>
      <StatusBar barStyle="light-content" backgroundColor={SKY9} translucent />

      {/* ── Multi-layer gradient bg ── */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: SKY9 }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: SKY7, opacity: 0.55 }]} />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: H * 0.5, backgroundColor: SKY5, opacity: 0.28 }} />

      {/* ── Decorative blobs ── */}
      <View style={{ position: 'absolute', top: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: SKY5, opacity: 0.12 }} />
      <View style={{ position: 'absolute', bottom: -80, right: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: TEAL, opacity: 0.08 }} />
      <View style={{ position: 'absolute', top: H * 0.38, left: -60, width: 160, height: 160, borderRadius: 80, backgroundColor: SKY4, opacity: 0.07 }} />

      {/* ── Dot grid (top-right) ── */}
      <View style={sp.dotGrid} pointerEvents="none">
        {Array.from({ length: 35 }).map((_, i) => <View key={i} style={sp.dot} />)}
      </View>
      {/* ── Dot grid (bottom-left) ── */}
      <View style={[sp.dotGrid, { top: undefined, right: undefined, bottom: H * 0.12, left: 18 }]} pointerEvents="none">
        {Array.from({ length: 20 }).map((_, i) => <View key={i} style={sp.dot} />)}
      </View>

      {/* ── Floating particles ── */}
      <Particle x={W * 0.08} y={H * 0.18} label="🩺" delay={200} />
      <Particle x={W * 0.78} y={H * 0.14} label="💊" delay={800} />
      <Particle x={W * 0.12} y={H * 0.72} label="🏥" delay={400} />
      <Particle x={W * 0.72} y={H * 0.68} label="🧬" delay={1100} />
      <Particle x={W * 0.85} y={H * 0.42} label="❤️" delay={600} />
      <Particle x={W * 0.04} y={H * 0.46} label="📋" delay={1400} />

      {/* ── Center content ── */}
      <Animated.View style={[sp.center, { opacity: enter, transform: [{ translateY: slideY }] }]}>
        <LogoMark pulse={pulse} />

        {/* App name */}
        <View style={sp.nameRow}>
          <Text style={sp.appName}>PulseMate</Text>
          <Animated.View style={[sp.badge, { transform: [{ scale: badgeA }] }]}>
            <Text style={sp.badgeText}>Connect</Text>
          </Animated.View>
        </View>

        {/* Tagline */}
        <Animated.Text style={[sp.tagline, { opacity: tagA }]}>
          Smart healthcare at your fingertips
        </Animated.Text>

        {/* ECG line */}
        <Animated.View style={{ opacity: tagA, marginTop: 20 }}>
          <EcgLine progress={ecgA} />
        </Animated.View>
      </Animated.View>

      {/* ── Bottom section ── */}
      <Animated.View style={[sp.bottom, { opacity: tagA }]}>
        {/* Feature chips */}
        <View style={sp.chips}>
          {[['🏥','Clinics'],['👨‍⚕️','Doctors'],['📋','Records'],['💊','Prescriptions']].map(([ic, lb]) => (
            <View key={lb} style={sp.chip}>
              <Text style={sp.chipIcon}>{ic}</Text>
              <Text style={sp.chipText}>{lb}</Text>
            </View>
          ))}
        </View>

        {/* Progress bar */}
        <View style={sp.barTrack}>
          <Animated.View style={[sp.barFill, {
            width: barA.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }]} />
          {/* Shimmer dot */}
          <Animated.View style={[sp.barDot, {
            left: barA.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }]} />
        </View>

        <Text style={sp.version}>v1.0.0  ·  Healthcare Platform</Text>
      </Animated.View>
    </View>
  );
}

// ─── Root navigator ───────────────────────────────────────────────────────────
function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return <SplashScreen />;
  return user ? <MainNavigator /> : <AuthNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
        <Toast
          config={{
            success: (props) => (
              <View style={sp.toast}>
                <Text style={sp.toastText}>✅ {props.text1}</Text>
              </View>
            ),
            error: (props) => (
              <View style={[sp.toast, { backgroundColor: '#FEE2E2', borderLeftColor: colors.danger }]}>
                <Text style={[sp.toastText, { color: colors.danger }]}>❌ {props.text1}</Text>
              </View>
            ),
          }}
        />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const sp = StyleSheet.create({

  // Root
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: SKY9 },

  // Dot grid
  dotGrid: {
    position: 'absolute', top: H * 0.06, right: 16,
    width: 110, flexDirection: 'row', flexWrap: 'wrap', gap: 12, opacity: 0.2,
  },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: WHITE },

  // Center block
  center: { alignItems: 'center', paddingHorizontal: 28 },

  // ── Logo image ──
  logoWrap: {
    width: 110, height: 110, borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.35)',
    shadowColor: SKY4, shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6, shadowRadius: 24, elevation: 16,
  },
  logoImg: { width: '100%', height: '100%' },

  // App name
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  appName: {
    fontSize: 42, fontWeight: '800', color: WHITE, letterSpacing: -1.5,
    textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 8,
  },
  badge: {
    marginTop: 10, paddingHorizontal: 9, paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 9,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#BAE6FD', letterSpacing: 0.6 },

  // Tagline
  tagline: {
    fontSize: 14, color: 'rgba(186,230,253,0.88)',
    textAlign: 'center', lineHeight: 21, letterSpacing: 0.15,
    maxWidth: 270, marginTop: 4,
  },

  // Bottom
  bottom: {
    position: 'absolute', bottom: 44, left: 0, right: 0,
    alignItems: 'center', gap: 14, paddingHorizontal: 28,
  },

  // Feature chips
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  chipIcon: { fontSize: 13 },
  chipText: { fontSize: 11, fontWeight: '600', color: 'rgba(186,230,253,0.9)' },

  // Progress bar
  barTrack: {
    width: W * 0.52, height: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2, overflow: 'visible',
  },
  barFill: {
    height: '100%', borderRadius: 2,
    backgroundColor: SKY4,
    shadowColor: SKY4, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9, shadowRadius: 5,
  },
  barDot: {
    position: 'absolute', top: -3.5,
    width: 10, height: 10, borderRadius: 5, marginLeft: -5,
    backgroundColor: WHITE,
    shadowColor: SKY4, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 8,
  },

  version: { fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5 },

  // Toast
  toast: {
    backgroundColor: '#F0FDF4', borderLeftWidth: 4, borderLeftColor: colors.secondary,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    marginHorizontal: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  toastText: { fontSize: 14, fontWeight: '600', color: '#065F46' },
});
