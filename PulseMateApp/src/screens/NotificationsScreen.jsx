import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getMyNotifications,
  markNotificationRead as apiMarkRead,
  markAllNotificationsRead,
  getInboxNotifications,
  markInboxRead,
  markAllInboxRead,
} from '../api/auth';
import { colors, shadow, radius } from '../theme';

const FILTERS = [
  { key: 'All',          icon: 'list'                  },
  { key: 'Appointments', icon: 'calendar-outline'      },
  { key: 'Queue Updates',icon: 'people-outline'        },
  { key: 'Reminders',    icon: 'notifications-outline' },
  { key: 'Offers',       icon: 'pricetag-outline'      },
  { key: 'Updates',      icon: 'megaphone-outline'     },
];

const fmtTime = (t) => {
  const d          = new Date(t);
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const yestStart  = new Date(todayStart - 86400000);

  if (d >= todayStart) {
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  } else if (d >= yestStart) {
    return `Yesterday, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  }
  return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
};

const isToday = (t) => {
  const d = new Date(t);
  const s = new Date(); s.setHours(0, 0, 0, 0);
  return d >= s;
};

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [inboxNotifs,   setInboxNotifs]   = useState([]);
  const [filter, setFilter]     = useState('All');
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [readIds, setReadIds]   = useState(new Set());
  const [inboxReadIds, setInboxReadIds] = useState(new Set());

  const load = useCallback(async () => {
    try {
      const [notifRes, inboxRes] = await Promise.allSettled([
        getMyNotifications(),
        getInboxNotifications({ limit: 30 }),
      ]);
      if (notifRes.status === 'fulfilled') {
        setNotifications(notifRes.value.data.data.notifications || []);
      }
      if (inboxRes.status === 'fulfilled') {
        const inbox = inboxRes.value.data.data.notifications || [];
        setInboxNotifs(inbox);
        setInboxReadIds(new Set(inbox.filter((n) => n.isRead).map((n) => n.id)));
      }
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = (id) => {
    setReadIds((p) => new Set([...p, id]));
    apiMarkRead(id).catch(() => {});
  };

  const markInboxNotifRead = (id) => {
    setInboxReadIds((p) => new Set([...p, id]));
    markInboxRead(id).catch(() => {});
  };

  const markAll = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
    setInboxReadIds(new Set(inboxNotifs.map((n) => n.id)));
    markAllNotificationsRead().catch(() => {});
    markAllInboxRead().catch(() => {});
  };

  const handlePress = (n) => {
    markRead(n.id);
    if (n.apptId) {
      navigation.navigate('AppointmentsTab');
      setTimeout(() => {
        navigation.navigate('AppointmentsTab', {
          screen: 'AppointmentDetail',
          params: { id: n.apptId },
        });
      }, 100);
    }
  };

  // Merge inbox campaign notifications into the list as 'Updates' category
  const campaignAsNotifs = inboxNotifs.map((n) => ({
    id: `inbox_${n.id}`,
    _inboxId: n.id,
    type: 'CAMPAIGN',
    category: 'Updates',
    title: n.title,
    body: n.message,
    sub: 'From PulseMate Team',
    time: n.createdAt,
    read: inboxReadIds.has(n.id),
    icon: 'megaphone-outline',
    color: '#7C3AED',
    bg: '#F5F3FF',
  }));

  const allNotifications = [...notifications, ...campaignAsNotifs];

  const filtered     = filter === 'All' ? allNotifications : allNotifications.filter((n) => n.category === filter);
  const todayItems   = filtered.filter((n) => isToday(n.time));
  const earlierItems = filtered.filter((n) => !isToday(n.time));

  const unreadCount = allNotifications.filter((n) => !n.read && !readIds.has(n.id) && !inboxReadIds.has(n._inboxId)).length;

  const handleNotifPress = (n) => {
    if (n._inboxId) {
      markInboxNotifRead(n._inboxId);
    } else {
      handlePress(n);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={s.headerMid}>
          <Text style={s.title}>Notifications</Text>
          <Text style={s.subtitle}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'Stay updated with your appointments and health'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {unreadCount > 0 && (
            <TouchableOpacity style={s.iconBtn} onPress={markAll}>
              <Ionicons name="checkmark-done-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('NotificationSettings')}>
            <Ionicons name="settings-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Filter chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterRow}
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[s.chip, active && s.chipActive]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.75}
            >
              <Ionicons name={f.icon} size={13} color={active ? '#fff' : colors.textMuted} />
              <Text style={[s.chipTxt, active && s.chipTxtActive]}>{f.key}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── List ── */}
      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        >
          {filtered.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>🔔</Text>
              <Text style={s.emptyTitle}>No notifications</Text>
              <Text style={s.emptySub}>You're all caught up!</Text>
            </View>
          ) : (
            <>
              {todayItems.length > 0 && (
                <>
                  <Text style={s.groupLabel}>Today</Text>
                  <View style={s.group}>
                    {todayItems.map((n, i) => (
                      <NotifRow
                        key={n.id}
                        notif={n}
                        isRead={readIds.has(n.id) || inboxReadIds.has(n._inboxId) || n.read}
                        isLast={i === todayItems.length - 1}
                        onPress={() => handleNotifPress(n)}
                      />
                    ))}
                  </View>
                </>
              )}

              {earlierItems.length > 0 && (
                <>
                  <Text style={[s.groupLabel, { marginTop: 20 }]}>Earlier</Text>
                  <View style={s.group}>
                    {earlierItems.map((n, i) => (
                      <NotifRow
                        key={n.id}
                        notif={n}
                        isRead={readIds.has(n.id) || inboxReadIds.has(n._inboxId) || n.read}
                        isLast={i === earlierItems.length - 1}
                        onPress={() => handleNotifPress(n)}
                      />
                    ))}
                  </View>
                </>
              )}
            </>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function NotifRow({ notif, isRead, isLast, onPress }) {
  const isUnread = !isRead;
  return (
    <TouchableOpacity
      style={[s.row, !isLast && s.rowBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Icon circle */}
      <View style={[s.iconCircle, { backgroundColor: notif.bg }]}>
        <Ionicons name={notif.icon} size={22} color={notif.color} />
      </View>

      {/* Text */}
      <View style={s.rowContent}>
        <View style={s.rowTop}>
          <Text style={[s.rowTitle, isUnread && s.rowTitleBold]} numberOfLines={1}>
            {notif.title}
          </Text>
          <View style={s.rowTimeWrap}>
            <Text style={s.rowTime}>{fmtTime(notif.time)}</Text>
            {isUnread && <View style={s.dot} />}
          </View>
        </View>
        <Text style={s.rowBody} numberOfLines={2}>{notif.body}</Text>
        {!!notif.sub && (
          <Text style={[
            s.rowSub,
            notif.type === 'OFFER' && s.rowSubLink,
          ]}>
            {notif.sub}
          </Text>
        )}
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={14} color="#CBD5E1" style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#F0F4FF' },
  loadingWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },

  // Header
  header:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  iconBtn:       { width: 38, height: 38, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow.sm },
  headerMid:     { flex: 1 },
  title:         { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle:      { fontSize: 11, color: colors.textMuted, marginTop: 1 },

  // Filters
  filterRow:     { paddingHorizontal: 16, paddingBottom: 14, gap: 8, alignItems: 'center' },
  chip:          { flexDirection: 'row', alignItems: 'center', gap: 5, height: 34, paddingHorizontal: 12, borderRadius: radius.full, backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.border },
  chipActive:    { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTxt:       { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  chipTxtActive: { color: '#fff' },

  // Group
  groupLabel:    { fontSize: 13, fontWeight: '700', color: colors.textSecondary, paddingHorizontal: 16, marginBottom: 6 },
  group:         { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: radius.xl, overflow: 'hidden', ...shadow.sm },

  // Row
  row:           { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 14, paddingVertical: 14, gap: 12 },
  rowBorder:     { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  iconCircle:    { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowContent:    { flex: 1 },
  rowTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 },
  rowTitle:      { fontSize: 13, fontWeight: '500', color: colors.text, flex: 1, marginRight: 8 },
  rowTitleBold:  { fontWeight: '700' },
  rowTimeWrap:   { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 },
  rowTime:       { fontSize: 11, color: colors.textMuted },
  dot:           { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  rowBody:       { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  rowSub:        { fontSize: 11, color: colors.textMuted, marginTop: 3 },
  rowSubLink:    { color: colors.primary, fontWeight: '600' },

  // Empty
  empty:         { alignItems: 'center', paddingTop: 80 },
  emptyEmoji:    { fontSize: 52, marginBottom: 14 },
  emptyTitle:    { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  emptySub:      { fontSize: 13, color: colors.textMuted },
});
