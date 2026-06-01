// ─────────────────────────────────────────────────────────────────────────────
//  LiveQueueScreen — PulseMate Connect  |  Real-time Queue Tracker
//  Socket events: queue:updated · queue:called · queue:positionUpdated
//                 queue:completed · queue:paused · queue:resumed
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, Easing, Dimensions, StatusBar, Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { getLiveQueue } from '../api/patient';
import { BASE_URL } from '../api/axios';

const { width: W } = Dimensions.get('window');

// ── Brand tokens ──────────────────────────────────────────────────────────────
const SKY4    = '#38BDF8';
const SKY5    = '#0EA5E9';
const SKY6    = '#0284C7';
const SKY7    = '#0369A1';
const SKY8    = '#075985';
const TEAL    = '#2DD4BF';
const TEAL_L  = '#CCFBF1';
const AMBER   = '#F59E0B';
const AMBER_L = '#FEF3C7';
const AMBER_D = '#92400E';
const GREEN   = '#10B981';
const GREEN_L = '#D1FAE5';
const GREEN_D = '#065F46';
const BLUE    = '#3B82F6';
const BLUE_L  = '#DBEAFE';
const BLUE_D  = '#1D4ED8';
const RED     = '#EF4444';
const RED_L   = '#FEE2E2';
const PURPLE  = '#8B5CF6';
const WHITE   = '#FFFFFF';
const SLATE   = '#0F172A';
const SLATE_6 = '#475569';
const MUTED   = '#94A3B8';
const BG      = '#F0F7FF';
const BORDER  = '#E2E8F0';

// ── Socket base (strip /api suffix) ──────────────────────────────────────────
const SOCKET_URL = BASE_URL.replace('/api', '');

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_META = {
  WAITING: {
    label:    'Waiting',
    subLabel: 'Your turn is coming up',
    icon:     'time',
    color:    AMBER,
    light:    AMBER_L,
    dark:     AMBER_D,
    gradient: [SKY7, SKY6],
  },
  CALLED: {
    label:    'You\'ve Been Called!',
    subLabel: 'Please proceed to the doctor\'s room now',
    icon:     'megaphone',
    color:    GREEN,
    light:    GREEN_L,
    dark:     GREEN_D,
    gradient: ['#059669', '#10B981'],
  },
  IN_CONSULTATION: {
    label:    'In Consultation',
    subLabel: 'Your consultation is in progress',
    icon:     'medical',
    color:    BLUE,
    light:    BLUE_L,
    dark:     BLUE_D,
    gradient: [BLUE_D, BLUE],
  },
  CHECKED_IN: {
    label:    'Checked In',
    subLabel: 'You are checked in and waiting',
    icon:     'checkmark-circle',
    color:    SKY5,
    light:    '#E0F2FE',
    dark:     SKY7,
    gradient: [SKY7, SKY5],
  },
  COMPLETED: {
    label:    'Consultation Complete',
    subLabel: 'Thank you for visiting',
    icon:     'checkmark-done-circle',
    color:    GREEN,
    light:    GREEN_L,
    dark:     GREEN_D,
    gradient: ['#059669', '#10B981'],
  },
  SKIPPED: {
    label:    'Skipped',
    subLabel: 'Please check with reception',
    icon:     'alert-circle',
    color:    RED,
    light:    RED_L,
    dark:     '#991B1B',
    gradient: ['#DC2626', RED],
  },
};

const getStatusMeta = (s) => STATUS_META[s] || STATUS_META.WAITING;

// ── Animated pulse ring ───────────────────────────────────────────────────────
function PulseRing({ color, size = 80 }) {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = (val, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(val, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          ]),
          Animated.timing(val, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
    anim(ring1, 0).start();
    anim(ring2, 700).start();
  }, []);

  const ringStyle = (val) => ({
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 2,
    borderColor: color,
    opacity: val.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.2, 0] }),
    transform: [{ scale: val.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }],
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={ringStyle(ring1)} />
      <Animated.View style={ringStyle(ring2)} />
    </View>
  );
}

// ── Live dot ──────────────────────────────────────────────────────────────────
function LiveDot({ color = TEAL }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute', width: 10, height: 10, borderRadius: 5,
        backgroundColor: color,
        opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] }),
        transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] }) }],
      }} />
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

// ── Queue progress bar ────────────────────────────────────────────────────────
function QueueProgressBar({ position, total, color }) {
  const anim = useRef(new Animated.Value(0)).current;
  const pct  = total > 0 ? Math.max(0, Math.min(1, 1 - (position - 1) / total)) : 0;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View style={lq.progressTrack}>
      <Animated.View
        style={[
          lq.progressFill,
          {
            width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            backgroundColor: color,
          },
        ]}
      />
      {/* Tick marks */}
      {Array.from({ length: Math.min(total, 10) }).map((_, i) => (
        <View
          key={i}
          style={[
            lq.progressTick,
            { left: `${((i + 1) / Math.min(total, 10)) * 100}%` },
          ]}
        />
      ))}
    </View>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, iconBg, iconColor, value, label, highlight }) {
  const scaleA = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleA, { toValue: 1.08, duration: 180, useNativeDriver: true }),
      Animated.spring(scaleA, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  }, [value]);

  return (
    <Animated.View style={[lq.statCard, highlight && lq.statCardHL, { transform: [{ scale: scaleA }] }]}>
      <View style={[lq.statIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[lq.statVal, highlight && { color: iconColor }]}>{value ?? '—'}</Text>
      <Text style={lq.statLabel}>{label}</Text>
    </Animated.View>
  );
}

// ── Called alert banner ───────────────────────────────────────────────────────
function CalledBanner({ visible }) {
  const slideA = useRef(new Animated.Value(-120)).current;
  const shakeA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.spring(slideA, { toValue: 0, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(shakeA, { toValue: 6,  duration: 60, useNativeDriver: true }),
            Animated.timing(shakeA, { toValue: -6, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeA, { toValue: 4,  duration: 60, useNativeDriver: true }),
            Animated.timing(shakeA, { toValue: -4, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeA, { toValue: 0,  duration: 60, useNativeDriver: true }),
            Animated.delay(3000),
          ]),
          { iterations: 4 }
        ),
      ]).start();
    } else {
      Animated.timing(slideA, { toValue: -120, duration: 300, useNativeDriver: true }).start();
    }
  }, [visible]);

  return (
    <Animated.View style={[lq.calledBanner, { transform: [{ translateY: slideA }, { translateX: shakeA }] }]}>
      <View style={lq.calledBannerIcon}>
        <Text style={{ fontSize: 28 }}>🔔</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={lq.calledBannerTitle}>Your Turn Has Arrived!</Text>
        <Text style={lq.calledBannerSub}>Please proceed to the doctor's room now</Text>
      </View>
      <View style={lq.calledArrow}>
        <Ionicons name="arrow-forward" size={20} color={WHITE} />
      </View>
    </Animated.View>
  );
}

// ── Main LiveQueueScreen ──────────────────────────────────────────────────────
export default function LiveQueueScreen({ route, navigation }) {
  const { appointmentId } = route.params;
  const insets = useSafeAreaInsets();

  // ── State ──────────────────────────────────────────────────────────────────
  const [data,        setData]        = useState(null);   // { appointment, queueInfo }
  const [loading,     setLoading]     = useState(true);
  const [socketState, setSocketState] = useState('connecting'); // connecting | live | polling | error
  const [lastUpdated, setLastUpdated] = useState(null);
  const [flashKey,    setFlashKey]    = useState(0);      // bump to trigger flash on update

  // ── Refs ───────────────────────────────────────────────────────────────────
  const socketRef   = useRef(null);
  const pollRef     = useRef(null);
  const enterA      = useRef(new Animated.Value(0)).current;
  const flashA      = useRef(new Animated.Value(0)).current;
  const tokenNumA   = useRef(new Animated.Value(1)).current;

  // ── Derived ────────────────────────────────────────────────────────────────
  const qi     = data?.queueInfo;
  const appt   = data?.appointment;
  const status = qi?.status || appt?.status || 'WAITING';
  const meta   = getStatusMeta(status);

  const queueNumber     = qi?.queueNumber     ?? appt?.queueNumber ?? null;
  const patientsAhead   = qi?.patientsAhead   ?? null;
  const currentServing  = qi?.currentlyServing ?? null;
  const estimatedWait   = qi?.estimatedWaitMinutes ?? appt?.estimatedWaitMinutes ?? null;
  const position        = qi?.position        ?? null;
  const queueStatus     = qi?.queueStatus     ?? 'ACTIVE';
  const roomName        = qi?.roomName        ?? null;

  const doctorName  = appt?.doctor?.user?.name;
  const doctorSpec  = appt?.doctor?.specialization;
  const clinicName  = appt?.clinic?.name;
  const apptType    = appt?.appointmentType;
  const apptDate    = appt?.appointmentDate
    ? new Date(appt.appointmentDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    : null;

  // Estimate total queue size for progress bar
  const totalInQueue = patientsAhead != null && position != null
    ? position + patientsAhead
    : null;

  // ── Flash animation on update ──────────────────────────────────────────────
  const triggerFlash = useCallback(() => {
    setFlashKey((k) => k + 1);
    setLastUpdated(new Date());
    Animated.sequence([
      Animated.timing(flashA, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(flashA, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
    // Bounce token number
    Animated.sequence([
      Animated.spring(tokenNumA, { toValue: 1.15, friction: 3, useNativeDriver: true }),
      Animated.spring(tokenNumA, { toValue: 1,    friction: 4, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Fetch queue data ───────────────────────────────────────────────────────
  const fetchQueue = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getLiveQueue(appointmentId);
      setData(res.data.data);
      if (!silent) triggerFlash();
    } catch {}
    finally { if (!silent) setLoading(false); }
  }, [appointmentId]);

  // ── Socket setup ───────────────────────────────────────────────────────────
  const connectSocket = useCallback(async (room) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      const socket = io(SOCKET_URL, {
        transports: ['websocket'],
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        setSocketState('live');
        socket.emit('patient:joinQueueRoom', {
          clinicId: room.split(':')[1],
          doctorId: room.split(':')[2],
          date:     room.split(':')[3],
        });
      });

      socket.on('queue:joined', () => {
        setSocketState('live');
      });

      socket.on('queue:updated', () => {
        fetchQueue(true);
        triggerFlash();
      });

      socket.on('queue:positionUpdated', () => {
        fetchQueue(true);
        triggerFlash();
      });

      socket.on('queue:called', (payload) => {
        fetchQueue(true);
        triggerFlash();
      });

      socket.on('queue:completed', () => {
        fetchQueue(true);
        triggerFlash();
      });

      socket.on('queue:paused', () => {
        fetchQueue(true);
        triggerFlash();
      });

      socket.on('queue:resumed', () => {
        fetchQueue(true);
        triggerFlash();
      });

      socket.on('disconnect', () => {
        setSocketState('polling');
      });

      socket.on('connect_error', () => {
        setSocketState('polling');
      });
    } catch {
      setSocketState('polling');
    }
  }, [fetchQueue, triggerFlash]);

  // ── Polling fallback ───────────────────────────────────────────────────────
  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      fetchQueue(true);
      triggerFlash();
    }, 15000);
  }, [fetchQueue, triggerFlash]);

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    // Entrance animation
    Animated.timing(enterA, {
      toValue: 1, duration: 550,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Initial fetch
    fetchQueue(false).then(() => {
      // After first fetch, connect socket if we have a room name
      // roomName comes from queueInfo in the response
    });

    // Always start polling as fallback
    startPolling();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [appointmentId]);

  // Connect socket once we have the roomName from data
  useEffect(() => {
    if (roomName && socketState === 'connecting') {
      connectSocket(roomName);
    }
  }, [roomName]);

  // ── Refresh handler ────────────────────────────────────────────────────────
  const handleRefresh = () => {
    fetchQueue(false);
  };

  // ── Format last updated ────────────────────────────────────────────────────
  const fmtUpdated = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading && !data) {
    return (
      <View style={lq.loadingRoot}>
        <StatusBar barStyle="light-content" backgroundColor={SKY7} />
        <View style={[lq.loadingHeader, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={lq.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={WHITE} />
          </TouchableOpacity>
          <Text style={lq.loadingTitle}>Live Queue</Text>
        </View>
        <View style={lq.loadingBody}>
          <ActivityIndicator color={SKY5} size="large" />
          <Text style={lq.loadingText}>Connecting to live queue...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={lq.root}>
      <StatusBar barStyle="light-content" backgroundColor={SKY8} translucent />

      {/* ── Called banner (slides in from top) ── */}
      <CalledBanner visible={status === 'CALLED'} />

      {/* ── Flash overlay on update ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: TEAL, opacity: flashA.interpolate({ inputRange: [0, 1], outputRange: [0, 0.06] }), zIndex: 50 },
        ]}
      />

      <Animated.ScrollView
        style={{ opacity: enterA }}
        contentContainerStyle={[lq.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ══════════════════════════════════════════════════════════════════
            HERO HEADER — gradient band with token number
        ══════════════════════════════════════════════════════════════════ */}
        <View style={[lq.hero, { paddingTop: insets.top + 12 }]}>
          {/* Decorative blobs */}
          <View style={lq.blobTL} />
          <View style={lq.blobBR} />
          <View style={lq.blobMid} />

          {/* Nav row */}
          <View style={lq.navRow}>
            <TouchableOpacity style={lq.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={20} color={WHITE} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={lq.navTitle}>Live Queue</Text>
              <Text style={lq.navSub}>{clinicName || 'Tracking your position'}</Text>
            </View>
            {/* Socket / connection badge */}
            <TouchableOpacity style={lq.connBadge} onPress={handleRefresh} activeOpacity={0.8}>
              {socketState === 'live' ? (
                <>
                  <LiveDot color={TEAL} />
                  <Text style={[lq.connText, { color: TEAL }]}>LIVE</Text>
                </>
              ) : socketState === 'polling' ? (
                <>
                  <View style={[lq.connDot, { backgroundColor: AMBER }]} />
                  <Text style={[lq.connText, { color: AMBER }]}>SYNC</Text>
                </>
              ) : (
                <ActivityIndicator size="small" color={TEAL} />
              )}
            </TouchableOpacity>
          </View>

          {/* ── Token number — the hero element ── */}
          <View style={lq.tokenSection}>
            {/* Pulse rings behind token */}
            <View style={lq.tokenRingWrap}>
              <PulseRing
                color={status === 'CALLED' ? GREEN : status === 'IN_CONSULTATION' ? BLUE : TEAL}
                size={120}
              />
            </View>

            <Animated.View style={[lq.tokenCircle, { transform: [{ scale: tokenNumA }] }]}>
              <View style={[lq.tokenCircleInner, { borderColor: meta.color + '60' }]}>
                <Text style={lq.tokenLabel}>YOUR TOKEN</Text>
                <Text style={lq.tokenNumber}>{queueNumber ?? '—'}</Text>
              </View>
            </Animated.View>
          </View>

          {/* ── Status pill ── */}
          <View style={[lq.statusPill, { backgroundColor: meta.color + '25', borderColor: meta.color + '50' }]}>
            <Ionicons name={meta.icon} size={16} color={meta.color} />
            <Text style={[lq.statusPillText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <Text style={lq.statusSubText}>{meta.subLabel}</Text>

          {/* ── Queue paused warning ── */}
          {queueStatus === 'PAUSED' && (
            <View style={lq.pausedBadge}>
              <Ionicons name="pause-circle" size={14} color={AMBER} />
              <Text style={lq.pausedText}>Queue is temporarily paused</Text>
            </View>
          )}

          {/* ── Last updated ── */}
          {fmtUpdated && (
            <Text style={lq.lastUpdated}>Updated {fmtUpdated}</Text>
          )}
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            STATS ROW — 3 key metrics
        ══════════════════════════════════════════════════════════════════ */}
        <View style={lq.statsRow}>
          <StatCard
            icon="people"
            iconBg={AMBER_L}
            iconColor={AMBER}
            value={patientsAhead}
            label="Ahead of You"
            highlight={patientsAhead === 0}
          />
          <StatCard
            icon="person"
            iconBg={BLUE_L}
            iconColor={BLUE}
            value={currentServing != null ? `#${currentServing}` : null}
            label="Now Serving"
          />
          <StatCard
            icon="timer"
            iconBg={GREEN_L}
            iconColor={GREEN}
            value={estimatedWait != null ? `${estimatedWait}m` : null}
            label="Est. Wait"
          />
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            QUEUE PROGRESS TRACKER
        ══════════════════════════════════════════════════════════════════ */}
        {status === 'WAITING' && totalInQueue != null && (
          <View style={lq.card}>
            <View style={lq.cardHeader}>
              <View style={[lq.cardIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="list" size={15} color={SKY6} />
              </View>
              <Text style={lq.cardTitle}>Queue Progress</Text>
              <View style={lq.cardBadge}>
                <Text style={lq.cardBadgeText}>Position #{position}</Text>
              </View>
            </View>

            {/* Airport-style progress bar */}
            <QueueProgressBar
              position={position}
              total={totalInQueue}
              color={meta.color}
            />

            {/* Position labels */}
            <View style={lq.progressLabels}>
              <View style={lq.progressLabelItem}>
                <View style={[lq.progressLabelDot, { backgroundColor: GREEN }]} />
                <Text style={lq.progressLabelText}>Start</Text>
              </View>
              <Text style={lq.progressLabelCenter}>
                {patientsAhead === 0 ? 'You\'re next!' : `${patientsAhead} ahead`}
              </Text>
              <View style={lq.progressLabelItem}>
                <View style={[lq.progressLabelDot, { backgroundColor: SKY5 }]} />
                <Text style={lq.progressLabelText}>Doctor</Text>
              </View>
            </View>

            {/* Queue steps — airport boarding style */}
            <View style={lq.stepsRow}>
              {[
                { key: 'BOOKED',    label: 'Booked',    icon: 'calendar-outline'       },
                { key: 'CHECKED_IN',label: 'Checked In',icon: 'checkmark-circle-outline'},
                { key: 'WAITING',   label: 'Waiting',   icon: 'time-outline'           },
                { key: 'CALLED',    label: 'Called',    icon: 'megaphone-outline'       },
                { key: 'DONE',      label: 'Done',      icon: 'medical-outline'         },
              ].map((step, idx, arr) => {
                const ORDER = ['BOOKED', 'CHECKED_IN', 'WAITING', 'CALLED', 'IN_CONSULTATION', 'COMPLETED'];
                const curIdx = ORDER.indexOf(status);
                const stepIdx = ORDER.indexOf(step.key === 'DONE' ? 'COMPLETED' : step.key);
                const done    = curIdx > stepIdx;
                const active  = curIdx === stepIdx || (step.key === 'DONE' && status === 'IN_CONSULTATION');
                return (
                  <View key={step.key} style={lq.stepItem}>
                    <View style={[
                      lq.stepCircle,
                      done   && { backgroundColor: GREEN,  borderColor: GREEN  },
                      active && { backgroundColor: meta.color, borderColor: meta.color },
                    ]}>
                      <Ionicons
                        name={done ? 'checkmark' : step.icon}
                        size={12}
                        color={done || active ? WHITE : MUTED}
                      />
                    </View>
                    <Text style={[lq.stepLabel, (done || active) && { color: done ? GREEN : meta.color, fontWeight: '700' }]}>
                      {step.label}
                    </Text>
                    {idx < arr.length - 1 && (
                      <View style={[lq.stepLine, done && { backgroundColor: GREEN }]} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            CALLED STATE — urgent action card
        ══════════════════════════════════════════════════════════════════ */}
        {status === 'CALLED' && (
          <View style={[lq.card, lq.calledCard]}>
            <View style={lq.calledCardTop}>
              <View style={lq.calledCardEmoji}>
                <Text style={{ fontSize: 36 }}>🏥</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={lq.calledCardTitle}>Please Go In Now</Text>
                <Text style={lq.calledCardSub}>The doctor is ready to see you</Text>
              </View>
            </View>
            <View style={lq.calledCardDivider} />
            <View style={lq.calledCardFooter}>
              <Ionicons name="information-circle-outline" size={14} color={GREEN_D} />
              <Text style={lq.calledCardNote}>
                Head to the consultation room. Show your token #{queueNumber} at the door.
              </Text>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            IN CONSULTATION
        ══════════════════════════════════════════════════════════════════ */}
        {status === 'IN_CONSULTATION' && (
          <View style={[lq.card, lq.consultCard]}>
            <View style={lq.consultTop}>
              <View style={lq.consultIcon}>
                <Ionicons name="medical" size={28} color={BLUE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={lq.consultTitle}>Consultation in Progress</Text>
                <Text style={lq.consultSub}>You are currently with the doctor</Text>
              </View>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            DOCTOR INFORMATION CARD
        ══════════════════════════════════════════════════════════════════ */}
        {doctorName && (
          <View style={lq.card}>
            <View style={lq.cardHeader}>
              <View style={[lq.cardIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="person" size={15} color={SKY6} />
              </View>
              <Text style={lq.cardTitle}>Your Doctor</Text>
            </View>

            <View style={lq.doctorRow}>
              <View style={lq.doctorAvatarWrap}>
                <Text style={lq.doctorAvatarText}>{doctorName?.charAt(0)?.toUpperCase() || 'D'}</Text>
                <View style={[lq.doctorOnlineDot, { backgroundColor: status === 'IN_CONSULTATION' ? BLUE : GREEN }]} />
              </View>
              <View style={lq.doctorInfo}>
                <Text style={lq.doctorName}>Dr. {doctorName}</Text>
                {doctorSpec && <Text style={lq.doctorSpec}>{doctorSpec}</Text>}
                <View style={lq.doctorStatusRow}>
                  <View style={[lq.doctorStatusDot, {
                    backgroundColor: status === 'IN_CONSULTATION' ? BLUE : GREEN,
                  }]} />
                  <Text style={[lq.doctorStatusText, {
                    color: status === 'IN_CONSULTATION' ? BLUE : GREEN,
                  }]}>
                    {status === 'IN_CONSULTATION' ? 'In Consultation' : 'Available'}
                  </Text>
                </View>
              </View>
              <View style={lq.doctorRight}>
                {apptType && (
                  <View style={[lq.apptTypeBadge, { backgroundColor: apptType === 'ONLINE' ? PURPLE_L : '#EFF6FF' }]}>
                    <Ionicons
                      name={apptType === 'ONLINE' ? 'videocam' : 'business'}
                      size={11}
                      color={apptType === 'ONLINE' ? PURPLE : SKY6}
                    />
                    <Text style={[lq.apptTypeText, { color: apptType === 'ONLINE' ? PURPLE : SKY6 }]}>
                      {apptType === 'ONLINE' ? 'Online' : 'In-Clinic'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            CLINIC INFORMATION CARD
        ══════════════════════════════════════════════════════════════════ */}
        {clinicName && (
          <View style={lq.card}>
            <View style={lq.cardHeader}>
              <View style={[lq.cardIconWrap, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="business" size={15} color={GREEN} />
              </View>
              <Text style={lq.cardTitle}>Clinic Details</Text>
            </View>

            <View style={lq.clinicRow}>
              <View style={lq.clinicIconWrap}>
                <Ionicons name="business" size={26} color={SKY6} />
              </View>
              <View style={lq.clinicInfo}>
                <Text style={lq.clinicName}>{clinicName}</Text>
                {apptDate && (
                  <View style={lq.clinicMetaRow}>
                    <Ionicons name="calendar-outline" size={12} color={MUTED} />
                    <Text style={lq.clinicMetaText}>{apptDate}</Text>
                  </View>
                )}
              </View>
              <View style={[lq.queueStatusBadge, {
                backgroundColor: queueStatus === 'ACTIVE' ? GREEN_L :
                                 queueStatus === 'PAUSED' ? AMBER_L : '#F1F5F9',
              }]}>
                <View style={[lq.queueStatusDot, {
                  backgroundColor: queueStatus === 'ACTIVE' ? GREEN :
                                   queueStatus === 'PAUSED' ? AMBER : MUTED,
                }]} />
                <Text style={[lq.queueStatusText, {
                  color: queueStatus === 'ACTIVE' ? GREEN_D :
                         queueStatus === 'PAUSED' ? AMBER_D : SLATE_6,
                }]}>
                  {queueStatus === 'ACTIVE' ? 'Queue Active' :
                   queueStatus === 'PAUSED' ? 'Queue Paused' : queueStatus}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TIPS CARD — while waiting
        ══════════════════════════════════════════════════════════════════ */}
        {status === 'WAITING' && (
          <View style={lq.tipsCard}>
            <View style={lq.tipsHeader}>
              <Ionicons name="bulb-outline" size={15} color={AMBER} />
              <Text style={lq.tipsTitle}>While You Wait</Text>
            </View>
            {[
              { icon: 'document-text-outline', text: 'Keep your prescriptions and reports ready' },
              { icon: 'notifications-outline', text: 'You\'ll be notified when it\'s your turn' },
              { icon: 'time-outline',          text: 'Estimated wait updates every 15 seconds' },
            ].map((tip, i) => (
              <View key={i} style={lq.tipRow}>
                <View style={lq.tipIconWrap}>
                  <Ionicons name={tip.icon} size={14} color={SKY6} />
                </View>
                <Text style={lq.tipText}>{tip.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            REFRESH BUTTON
        ══════════════════════════════════════════════════════════════════ */}
        <TouchableOpacity style={lq.refreshBtn} onPress={handleRefresh} activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator size="small" color={SKY6} />
          ) : (
            <>
              <Ionicons name="refresh" size={16} color={SKY6} />
              <Text style={lq.refreshText}>Refresh Queue</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={lq.footerNote}>
          {socketState === 'live'
            ? '⚡ Connected — updates in real-time via Socket.IO'
            : '🔄 Polling every 15 seconds for updates'}
        </Text>
      </Animated.ScrollView>
    </View>
  );
}

// ── Missing constant ──────────────────────────────────────────────────────────
const PURPLE_L = '#EDE9FE';

// ── Styles ────────────────────────────────────────────────────────────────────
const lq = StyleSheet.create({

  // ── Root & loading ──────────────────────────────────────────────────────────
  root:         { flex: 1, backgroundColor: BG },
  loadingRoot:  { flex: 1, backgroundColor: SKY7 },
  loadingHeader:{
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingBottom: 16,
  },
  loadingTitle: { fontSize: 18, fontWeight: '800', color: WHITE },
  loadingBody:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText:  { fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },

  scroll: { gap: 12, paddingHorizontal: 16, paddingTop: 0 },

  // ── Hero header ─────────────────────────────────────────────────────────────
  hero: {
    backgroundColor: SKY7,
    paddingHorizontal: 20,
    paddingBottom: 28,
    alignItems: 'center',
    overflow: 'hidden',
    marginHorizontal: -16,
    marginBottom: 4,
  },
  blobTL: {
    position: 'absolute', top: -60, left: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  blobBR: {
    position: 'absolute', bottom: -50, right: -50,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  blobMid: {
    position: 'absolute', top: 60, right: 40,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(45,212,191,0.1)',
  },

  // Nav
  navRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', marginBottom: 28 },
  backBtn:  {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  navTitle: { fontSize: 18, fontWeight: '800', color: WHITE, letterSpacing: -0.3 },
  navSub:   { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 1 },

  // Connection badge
  connBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  connDot:  { width: 7, height: 7, borderRadius: 4 },
  connText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },

  // Token
  tokenSection:   { alignItems: 'center', justifyContent: 'center', marginBottom: 20, height: 160 },
  tokenRingWrap:  { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  tokenCircle:    {
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 12,
  },
  tokenCircleInner:{
    width: 118, height: 118, borderRadius: 59,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  tokenLabel:  { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.65)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 },
  tokenNumber: { fontSize: 56, fontWeight: '900', color: WHITE, letterSpacing: -2, lineHeight: 60 },

  // Status pill
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, marginBottom: 8,
  },
  statusPillText: { fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },
  statusSubText:  { fontSize: 12, color: 'rgba(255,255,255,0.65)', textAlign: 'center', marginBottom: 10 },

  // Paused badge
  pausedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(245,158,11,0.2)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)',
    marginBottom: 8,
  },
  pausedText:  { fontSize: 12, fontWeight: '700', color: AMBER },
  lastUpdated: { fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 4 },

  // ── Stats row ────────────────────────────────────────────────────────────────
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: WHITE, borderRadius: 18,
    padding: 14, alignItems: 'center', gap: 6,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  statCardHL: {
    borderWidth: 1.5, borderColor: GREEN,
    shadowColor: GREEN, shadowOpacity: 0.15,
  },
  statIconWrap: {
    width: 36, height: 36, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  statVal:   { fontSize: 22, fontWeight: '900', color: SLATE, letterSpacing: -0.5 },
  statLabel: { fontSize: 10, color: MUTED, fontWeight: '600', textAlign: 'center' },

  // ── Card ─────────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: WHITE, borderRadius: 20, padding: 16,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardIconWrap: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  cardTitle:    { fontSize: 14, fontWeight: '800', color: SLATE, flex: 1, letterSpacing: -0.2 },
  cardBadge:    { backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  cardBadgeText:{ fontSize: 11, fontWeight: '700', color: SKY6 },

  // ── Progress bar ─────────────────────────────────────────────────────────────
  progressTrack: {
    height: 10, backgroundColor: '#F1F5F9', borderRadius: 5,
    overflow: 'hidden', marginBottom: 8, position: 'relative',
  },
  progressFill:  { height: '100%', borderRadius: 5 },
  progressTick:  {
    position: 'absolute', top: 0, bottom: 0,
    width: 1, backgroundColor: 'rgba(255,255,255,0.6)',
  },
  progressLabels:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  progressLabelItem:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  progressLabelDot: { width: 6, height: 6, borderRadius: 3 },
  progressLabelText:{ fontSize: 10, color: MUTED, fontWeight: '600' },
  progressLabelCenter:{ fontSize: 11, fontWeight: '700', color: SLATE_6 },

  // Steps
  stepsRow:    { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  stepItem:    { alignItems: 'center', flex: 1, position: 'relative' },
  stepCircle:  {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F1F5F9', borderWidth: 2, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center', marginBottom: 5, zIndex: 1,
  },
  stepLabel:   { fontSize: 9, color: MUTED, fontWeight: '600', textAlign: 'center' },
  stepLine:    {
    position: 'absolute', top: 13, left: '50%', right: '-50%',
    height: 2, backgroundColor: BORDER, zIndex: 0,
  },

  // ── Called card ──────────────────────────────────────────────────────────────
  calledCard:     { borderWidth: 2, borderColor: GREEN, backgroundColor: '#F0FDF4' },
  calledCardTop:  { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  calledCardEmoji:{ width: 60, height: 60, borderRadius: 18, backgroundColor: GREEN_L, alignItems: 'center', justifyContent: 'center' },
  calledCardTitle:{ fontSize: 18, fontWeight: '800', color: GREEN_D, marginBottom: 4 },
  calledCardSub:  { fontSize: 13, color: GREEN_D, opacity: 0.8 },
  calledCardDivider:{ height: 1, backgroundColor: GREEN + '30', marginBottom: 12 },
  calledCardFooter: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  calledCardNote: { flex: 1, fontSize: 12, color: GREEN_D, lineHeight: 18 },

  // ── Consultation card ─────────────────────────────────────────────────────────
  consultCard:  { borderWidth: 2, borderColor: BLUE, backgroundColor: '#EFF6FF' },
  consultTop:   { flexDirection: 'row', alignItems: 'center', gap: 14 },
  consultIcon:  { width: 56, height: 56, borderRadius: 16, backgroundColor: BLUE_L, alignItems: 'center', justifyContent: 'center' },
  consultTitle: { fontSize: 16, fontWeight: '800', color: BLUE_D, marginBottom: 4 },
  consultSub:   { fontSize: 12, color: BLUE_D, opacity: 0.8 },

  // ── Doctor card ───────────────────────────────────────────────────────────────
  doctorRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  doctorAvatarWrap:{
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  doctorAvatarText:{ fontSize: 22, fontWeight: '800', color: SKY6 },
  doctorOnlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: WHITE,
  },
  doctorInfo:      { flex: 1 },
  doctorName:      { fontSize: 15, fontWeight: '800', color: SLATE, marginBottom: 2 },
  doctorSpec:      { fontSize: 12, color: SKY6, fontWeight: '600', marginBottom: 5 },
  doctorStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  doctorStatusDot: { width: 6, height: 6, borderRadius: 3 },
  doctorStatusText:{ fontSize: 11, fontWeight: '700' },
  doctorRight:     { alignItems: 'flex-end' },
  apptTypeBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  apptTypeText:    { fontSize: 11, fontWeight: '700' },

  // ── Clinic card ───────────────────────────────────────────────────────────────
  clinicRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clinicIconWrap:  { width: 52, height: 52, borderRadius: 16, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  clinicInfo:      { flex: 1 },
  clinicName:      { fontSize: 15, fontWeight: '800', color: SLATE, marginBottom: 4 },
  clinicMetaRow:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  clinicMetaText:  { fontSize: 12, color: MUTED },
  queueStatusBadge:{ flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  queueStatusDot:  { width: 6, height: 6, borderRadius: 3 },
  queueStatusText: { fontSize: 11, fontWeight: '700' },

  // ── Tips card ─────────────────────────────────────────────────────────────────
  tipsCard:   {
    backgroundColor: WHITE, borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: AMBER_L,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  tipsTitle:  { fontSize: 13, fontWeight: '800', color: SLATE },
  tipRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  tipIconWrap:{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  tipText:    { flex: 1, fontSize: 12, color: SLATE_6, lineHeight: 17 },

  // ── Refresh & footer ──────────────────────────────────────────────────────────
  refreshBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: WHITE, borderRadius: 14, paddingVertical: 14,
    borderWidth: 1.5, borderColor: '#BAE6FD',
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  refreshText:{ fontSize: 14, fontWeight: '700', color: SKY6 },
  footerNote: { textAlign: 'center', fontSize: 11, color: MUTED, paddingBottom: 8 },

  // ── Called banner (slides from top) ──────────────────────────────────────────
  calledBanner: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: GREEN, paddingHorizontal: 20, paddingVertical: 14,
    shadowColor: GREEN, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 12,
  },
  calledBannerIcon:  { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  calledBannerTitle: { fontSize: 15, fontWeight: '800', color: WHITE, marginBottom: 2 },
  calledBannerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  calledArrow:       { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
});
