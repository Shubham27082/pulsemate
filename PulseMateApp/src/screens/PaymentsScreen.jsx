import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getMyPayments } from '../api/patient';
import Card from '../components/Card';
import { colors } from '../theme';

const METHOD_ICONS = {
  RAZORPAY: 'card-outline',
  CASH:     'cash-outline',
  UPI:      'phone-portrait-outline',
};

const STATUS_STYLE = {
  PAID:     { bg: '#D1FAE5', text: '#065F46' },
  PENDING:  { bg: '#FEF3C7', text: '#92400E' },
  FAILED:   { bg: '#FEE2E2', text: '#991B1B' },
  REFUNDED: { bg: '#EDE9FE', text: '#5B21B6' },
};

export default function PaymentsScreen() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await getMyPayments();
      setPayments(res.data.data.payments || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalPaid = payments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Payments</Text>
      </View>

      {/* Summary card */}
      {!loading && payments.length > 0 && (
        <View style={s.summaryRow}>
          <View style={s.summaryBox}>
            <Text style={s.summaryVal}>₹{totalPaid}</Text>
            <Text style={s.summaryLabel}>Total Paid</Text>
          </View>
          <View style={s.summaryBox}>
            <Text style={s.summaryVal}>{payments.filter((p) => p.status === 'PAID').length}</Text>
            <Text style={s.summaryLabel}>Transactions</Text>
          </View>
          <View style={[s.summaryBox, { borderRightWidth: 0 }]}>
            <Text style={s.summaryVal}>{payments.filter((p) => p.status === 'PENDING').length}</Text>
            <Text style={s.summaryLabel}>Pending</Text>
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(p) => p.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>💳</Text>
              <Text style={s.emptyTitle}>No payments yet</Text>
              <Text style={s.emptySub}>Your booking payment history will appear here</Text>
            </View>
          }
          renderItem={({ item: pay }) => {
            const st = STATUS_STYLE[pay.status] || STATUS_STYLE.PENDING;
            return (
              <Card>
                <View style={s.payRow}>
                  <View style={s.iconWrap}>
                    <Ionicons
                      name={METHOD_ICONS[pay.method] || 'card-outline'}
                      size={22}
                      color={colors.primary}
                    />
                  </View>
                  <View style={s.payInfo}>
                    <Text style={s.payDoctor}>
                      {pay.appointment?.doctor?.user?.name || 'Doctor'}
                    </Text>
                    <Text style={s.payClinic}>
                      {pay.appointment?.clinic?.name || '—'}
                    </Text>
                    <Text style={s.payDate}>
                      {pay.paidAt
                        ? new Date(pay.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : new Date(pay.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={s.payRight}>
                    <Text style={s.payAmount}>₹{pay.amount}</Text>
                    <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
                      <Text style={[s.statusText, { color: st.text }]}>{pay.status}</Text>
                    </View>
                  </View>
                </View>

                {pay.razorpayPaymentId && (
                  <View style={s.txnRow}>
                    <Ionicons name="receipt-outline" size={12} color={colors.textMuted} />
                    <Text style={s.txnId} numberOfLines={1}>
                      {pay.razorpayPaymentId}
                    </Text>
                  </View>
                )}
              </Card>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.bg },
  header:       { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title:        { fontSize: 22, fontWeight: '800', color: colors.text },

  summaryRow:   { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  summaryBox:   { flex: 1, alignItems: 'center', paddingVertical: 14, borderRightWidth: 1, borderRightColor: colors.border },
  summaryVal:   { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 2 },
  summaryLabel: { fontSize: 11, color: colors.textMuted },

  list:         { paddingHorizontal: 20, paddingBottom: 40 },

  payRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap:     { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  payInfo:      { flex: 1 },
  payDoctor:    { fontSize: 14, fontWeight: '700', color: colors.text },
  payClinic:    { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  payDate:      { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  payRight:     { alignItems: 'flex-end', gap: 4 },
  payAmount:    { fontSize: 16, fontWeight: '800', color: colors.text },
  statusBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText:   { fontSize: 10, fontWeight: '700' },

  txnRow:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  txnId:        { fontSize: 11, color: colors.textMuted, flex: 1 },

  empty:        { alignItems: 'center', paddingTop: 60 },
  emptyIcon:    { fontSize: 48, marginBottom: 12 },
  emptyTitle:   { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  emptySub:     { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 20 },
});
