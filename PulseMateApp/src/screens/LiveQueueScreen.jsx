import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getLiveQueue } from '../api/patient';
import { colors } from '../theme';
import Card from '../components/Card';

export default function LiveQueueScreen({ route, navigation }) {
  const { appointmentId } = route.params;
  const [queueInfo, setQueueInfo] = useState(null);
  const [loading, setLoading]     = useState(true);
  const intervalRef = useRef(null);

  const load = async () => {
    try {
      const res = await getLiveQueue(appointmentId);
      const { appointment, queueInfo } = res.data.data;
      setQueueInfo({
        queueItem: queueInfo ? {
          status:      queueInfo.status,
          queueNumber: queueInfo.queueNumber,
          position:    queueInfo.position,
        } : {
          // No queue yet — use appointment data
          status:      appointment?.status || 'WAITING',
          queueNumber: appointment?.queueNumber,
          position:    appointment?.queueNumber,
        },
        waitingAhead:         queueInfo?.patientsAhead ?? null,
        estimatedWaitMinutes: queueInfo?.estimatedWaitMinutes ?? appointment?.estimatedWaitMinutes ?? null,
        queue: queueInfo ? { status: queueInfo.queueStatus } : { status: 'ACTIVE' },
        totalWaiting:   null,
        totalCompleted: null,
        doctor: appointment?.doctor ? {
          name:           appointment.doctor.user?.name,
          specialization: appointment.doctor.specialization,
        } : null,
        clinic: appointment?.clinic?.name || null,
      });
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    // Poll every 15 seconds for live updates
    intervalRef.current = setInterval(load, 15000);
    return () => clearInterval(intervalRef.current);
  }, [appointmentId]);

  const statusColor = {
    WAITING:        { bg: '#FEF3C7', text: '#92400E', icon: 'time-outline' },
    CALLED:         { bg: '#EDE9FE', text: '#5B21B6', icon: 'megaphone-outline' },
    IN_CONSULTATION:{ bg: '#D1FAE5', text: '#065F46', icon: 'medical-outline' },
    COMPLETED:      { bg: '#D1FAE5', text: '#065F46', icon: 'checkmark-circle-outline' },
  };

  const myStatus = queueInfo?.queueItem?.status || 'WAITING';
  const sc = statusColor[myStatus] || statusColor.WAITING;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
          <Text style={s.backText}>Live Queue</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} />
        ) : !queueInfo ? (
          <View style={s.errorCard}>
            <Ionicons name="time-outline" size={48} color={colors.textMuted} style={{ marginBottom: 12 }} />
            <Text style={s.errorText}>Loading queue information...</Text>
            <TouchableOpacity onPress={load} style={{ marginTop: 16 }}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Live indicator */}
            <View style={s.liveRow}>
              <View style={s.liveDot} />
              <Text style={s.liveText}>Live Updates</Text>
              <TouchableOpacity onPress={load} style={s.refreshBtn}>
                <Ionicons name="refresh-outline" size={16} color={colors.primary} />
                <Text style={s.refreshText}>Refresh</Text>
              </TouchableOpacity>
            </View>

            {/* My status */}
            <Card style={[s.statusCard, { backgroundColor: sc.bg }]}>
              <View style={s.statusRow}>
                <Ionicons name={sc.icon} size={32} color={sc.text} />
                <View style={s.statusInfo}>
                  <Text style={[s.statusTitle, { color: sc.text }]}>
                    {myStatus === 'WAITING'         ? 'You are waiting'       :
                     myStatus === 'CALLED'          ? 'You have been called!' :
                     myStatus === 'IN_CONSULTATION' ? 'In consultation'       :
                                                      'Consultation complete'}
                  </Text>
                  {queueInfo.queueItem?.queueNumber && (
                    <Text style={[s.queueNum, { color: sc.text }]}>
                      Queue #{queueInfo.queueItem.queueNumber}
                    </Text>
                  )}
                </View>
              </View>
            </Card>

            {/* Position & wait */}
            {myStatus === 'WAITING' && (
              <View style={s.statsRow}>
                <View style={s.statBox}>
                  <Text style={s.statVal}>{queueInfo.queueItem?.position || '—'}</Text>
                  <Text style={s.statLabel}>Your Position</Text>
                </View>
                <View style={s.statBox}>
                  <Text style={s.statVal}>{queueInfo.waitingAhead ?? '—'}</Text>
                  <Text style={s.statLabel}>Ahead of You</Text>
                </View>
                <View style={s.statBox}>
                  <Text style={s.statVal}>
                    {queueInfo.estimatedWaitMinutes ? `${queueInfo.estimatedWaitMinutes}m` : '—'}
                  </Text>
                  <Text style={s.statLabel}>Est. Wait</Text>
                </View>
              </View>
            )}

            {/* Called alert */}
            {myStatus === 'CALLED' && (
              <Card style={s.calledCard}>
                <Text style={s.calledIcon}>🔔</Text>
                <Text style={s.calledTitle}>Please proceed to the doctor's room!</Text>
                <Text style={s.calledSub}>Your turn has arrived. Head to the consultation room now.</Text>
              </Card>
            )}

            {/* Doctor info */}
            {queueInfo.doctor && (
              <Card>
                <Text style={s.sectionTitle}>Your Doctor</Text>
                <View style={s.docRow}>
                  <View style={s.docAvatar}>
                    <Text style={s.docAvatarText}>{queueInfo.doctor?.name?.charAt(0) || 'D'}</Text>
                  </View>
                  <View>
                    <Text style={s.docName}>{queueInfo.doctor?.name}</Text>
                    <Text style={s.docSpec}>{queueInfo.doctor?.specialization}</Text>
                  </View>
                </View>
              </Card>
            )}

            {/* Queue status */}
            {queueInfo.queue && (
              <Card>
                <Text style={s.sectionTitle}>Queue Status</Text>
                <View style={s.queueStats}>
                  <View style={s.queueStat}>
                    <Text style={s.queueStatVal}>{queueInfo.totalWaiting ?? '—'}</Text>
                    <Text style={s.queueStatLabel}>Waiting</Text>
                  </View>
                  <View style={s.queueStat}>
                    <Text style={s.queueStatVal}>{queueInfo.totalCompleted ?? '—'}</Text>
                    <Text style={s.queueStatLabel}>Completed</Text>
                  </View>
                  <View style={[s.queueStat, { borderRightWidth: 0 }]}>
                    <Text style={[s.queueStatVal, {
                      color: queueInfo.queue?.status === 'ACTIVE' ? colors.secondary :
                             queueInfo.queue?.status === 'PAUSED' ? colors.warning : colors.textMuted
                    }]}>
                      {queueInfo.queue?.status}
                    </Text>
                    <Text style={s.queueStatLabel}>Queue</Text>
                  </View>
                </View>
              </Card>
            )}

            <Text style={s.autoRefresh}>Auto-refreshes every 15 seconds</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: colors.bg },
  content:       { padding: 20, paddingBottom: 40 },
  back:          { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  backText:      { fontSize: 18, fontWeight: '700', color: colors.text },
  liveRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  liveDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.secondary },
  liveText:      { flex: 1, fontSize: 13, fontWeight: '600', color: colors.secondary },
  refreshBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  refreshText:   { fontSize: 13, color: colors.primary, fontWeight: '600' },
  statusCard:    { marginBottom: 16 },
  statusRow:     { flexDirection: 'row', alignItems: 'center', gap: 16 },
  statusInfo:    { flex: 1 },
  statusTitle:   { fontSize: 18, fontWeight: '800' },
  queueNum:      { fontSize: 14, fontWeight: '600', marginTop: 4 },
  statsRow:      { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox:       { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  statVal:       { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 4 },
  statLabel:     { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  calledCard:    { backgroundColor: '#EDE9FE', alignItems: 'center', paddingVertical: 24 },
  calledIcon:    { fontSize: 40, marginBottom: 12 },
  calledTitle:   { fontSize: 16, fontWeight: '800', color: '#5B21B6', textAlign: 'center', marginBottom: 8 },
  calledSub:     { fontSize: 13, color: '#6D28D9', textAlign: 'center', lineHeight: 20 },
  sectionTitle:  { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  docRow:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  docAvatar:     { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  docAvatarText: { fontSize: 18, fontWeight: '700', color: colors.primary },
  docName:       { fontSize: 15, fontWeight: '700', color: colors.text },
  docSpec:       { fontSize: 13, color: colors.primary, marginTop: 2 },
  queueStats:    { flexDirection: 'row' },
  queueStat:     { flex: 1, alignItems: 'center', paddingVertical: 8, borderRightWidth: 1, borderRightColor: colors.border },
  queueStatVal:  { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 4 },
  queueStatLabel:{ fontSize: 11, color: colors.textMuted },
  autoRefresh:   { textAlign: 'center', fontSize: 12, color: colors.textMuted, marginTop: 16 },
  errorCard:     { alignItems: 'center', paddingVertical: 32 },
  errorText:     { fontSize: 14, color: colors.textMuted },
});
