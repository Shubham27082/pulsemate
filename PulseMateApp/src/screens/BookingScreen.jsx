import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { initiatePayment, verifyPayment } from '../api/patient';
import Card from '../components/Card';
import { colors } from '../theme';

export default function BookingScreen({ route, navigation }) {
  const { doctorId, clinicId, doctorName, clinicName, fee } = route.params;

  const [date, setDate]         = useState('');
  const [type, setType]         = useState('OFFLINE');
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading]   = useState(false);

  // Generate next 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      key:     d.toISOString().split('T')[0],
      weekday: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      day:     d.getDate(),
      month:   d.toLocaleDateString('en-IN', { month: 'short' }),
      isToday: i === 0,
    };
  });

  const handleBook = async () => {
    if (!date) { Alert.alert('Select Date', 'Please select an appointment date'); return; }
    setLoading(true);
    try {
      // Step 1: initiate — creates appointment + Razorpay order
      const initRes = await initiatePayment({
        doctorId,
        clinicId,
        appointmentType: type,
        appointmentDate: date,
        symptoms: symptoms.trim() || undefined,
      });
      const { appointmentId, order, devMode } = initRes.data.data;

      // Step 2: verify (dev mode skips real payment)
      if (devMode || order?.id?.startsWith('order_dev_')) {
        const verifyRes = await verifyPayment({
          appointmentId,
          razorpayOrderId:   order.id,
          razorpayPaymentId: `pay_dev_${Date.now()}`,
          razorpaySignature: 'dev_sig',
        });
        const appt = verifyRes.data.data.appointment;
        Alert.alert(
          '✅ Appointment Booked!',
          `Confirmed with Dr. ${doctorName}\nDate: ${date}${appt.queueNumber ? `\nQueue #${appt.queueNumber}` : ''}`,
          [{ text: 'View Appointments', onPress: () => navigation.navigate('AppointmentsTab') }]
        );
      } else {
        // Production: integrate Razorpay SDK here
        Alert.alert('Payment Required', `Order ID: ${order.id}\nAmount: ₹${(order.amount / 100).toFixed(0)}`);
      }
    } catch (err) {
      Alert.alert('Booking Failed', err.response?.data?.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
          <Text style={s.backText}>Book Appointment</Text>
        </TouchableOpacity>

        {/* Doctor info */}
        <Card style={s.docCard}>
          <View style={s.docRow}>
            <View style={s.docAvatar}>
              <Text style={s.docAvatarText}>{doctorName?.charAt(0) || 'D'}</Text>
            </View>
            <View style={s.docInfo}>
              <Text style={s.docName}>{doctorName}</Text>
              <Text style={s.clinicName}>{clinicName}</Text>
            </View>
          </View>
          <View style={s.feeRow}>
            <Text style={s.feeLabel}>Booking Fee (platform)</Text>
            <Text style={s.feeVal}>₹10</Text>
          </View>
          <Text style={s.feeNote}>Consultation fee ₹{fee || 0} payable at clinic</Text>
        </Card>

        {/* Appointment type */}
        <Text style={s.label}>Appointment Type</Text>
        <View style={s.typeRow}>
          {[
            { key: 'OFFLINE', icon: 'business-outline',  label: 'In-Clinic' },
            { key: 'ONLINE',  icon: 'videocam-outline',  label: 'Online'    },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[s.typeBtn, type === t.key && s.typeBtnActive]}
              onPress={() => setType(t.key)}
            >
              <Ionicons
                name={t.icon}
                size={18}
                color={type === t.key ? '#fff' : colors.textMuted}
              />
              <Text style={[s.typeBtnText, type === t.key && s.typeBtnTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date picker */}
        <Text style={s.label}>Select Date</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.dateScroll}
          contentContainerStyle={s.dateContent}
        >
          {days.map((d) => (
            <TouchableOpacity
              key={d.key}
              style={[s.dateCard, date === d.key && s.dateCardActive]}
              onPress={() => setDate(d.key)}
            >
              <Text style={[s.dateWeekday, date === d.key && s.dateTextActive]}>
                {d.isToday ? 'Today' : d.weekday}
              </Text>
              <Text style={[s.dateDay, date === d.key && s.dateTextActive]}>{d.day}</Text>
              <Text style={[s.dateMonth, date === d.key && s.dateTextActive]}>{d.month}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Symptoms */}
        <Text style={s.label}>
          Symptoms / Reason <Text style={s.optional}>(optional)</Text>
        </Text>
        <TextInput
          style={s.textarea}
          placeholder="Describe your symptoms or reason for visit..."
          placeholderTextColor={colors.textMuted}
          value={symptoms}
          onChangeText={setSymptoms}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Summary */}
        <Card style={s.summaryCard}>
          <Text style={s.summaryTitle}>Booking Summary</Text>
          <SummaryRow label="Doctor"  value={doctorName} />
          <SummaryRow label="Clinic"  value={clinicName} />
          <SummaryRow label="Type"    value={type === 'OFFLINE' ? 'In-Clinic' : 'Online'} />
          <SummaryRow label="Date"    value={date || 'Not selected'} />
          <View style={[s.summaryRow, s.summaryTotal]}>
            <Text style={s.summaryKey}>Booking Fee</Text>
            <Text style={s.summaryFee}>₹10</Text>
          </View>
        </Card>

        {/* Confirm button */}
        <TouchableOpacity
          style={[s.bookBtn, (!date || loading) && s.bookBtnDisabled]}
          onPress={handleBook}
          disabled={!date || loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={s.bookBtnText}>Confirm Booking</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }) {
  return (
    <View style={s.summaryRow}>
      <Text style={s.summaryKey}>{label}</Text>
      <Text style={s.summaryVal}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: colors.bg },
  content:          { padding: 20, paddingBottom: 40 },
  back:             { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  backText:         { fontSize: 18, fontWeight: '700', color: colors.text },

  // Doctor card
  docCard:          { marginBottom: 20 },
  docRow:           { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  docAvatar:        { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  docAvatarText:    { fontSize: 20, fontWeight: '700', color: colors.primary },
  docInfo:          { flex: 1 },
  docName:          { fontSize: 16, fontWeight: '700', color: colors.text },
  clinicName:       { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  feeRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeLabel:         { fontSize: 13, color: colors.textMuted },
  feeVal:           { fontSize: 18, fontWeight: '800', color: colors.secondary },
  feeNote:          { fontSize: 11, color: colors.textMuted, marginTop: 4 },

  // Form
  label:            { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 10 },
  optional:         { fontWeight: '400', color: colors.textMuted, fontSize: 13 },

  // Type toggle
  typeRow:          { flexDirection: 'row', gap: 10, marginBottom: 20 },
  typeBtn:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#fff' },
  typeBtnActive:    { backgroundColor: colors.primary, borderColor: colors.primary },
  typeBtnText:      { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  typeBtnTextActive:{ color: '#fff' },

  // Date picker
  dateScroll:       { marginBottom: 20 },
  dateContent:      { gap: 10, paddingRight: 4 },
  dateCard:         { width: 64, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', paddingVertical: 12, borderWidth: 1.5, borderColor: colors.border },
  dateCardActive:   { backgroundColor: colors.primary, borderColor: colors.primary },
  dateWeekday:      { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginBottom: 4 },
  dateDay:          { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 2 },
  dateMonth:        { fontSize: 11, color: colors.textMuted },
  dateTextActive:   { color: '#fff' },

  // Symptoms
  textarea:         { borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 14, color: colors.text, backgroundColor: '#fff', minHeight: 90, marginBottom: 20 },

  // Summary
  summaryCard:      { backgroundColor: '#F8FAFC', marginBottom: 20 },
  summaryTitle:     { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 12 },
  summaryRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryTotal:     { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 4, marginBottom: 0 },
  summaryKey:       { fontSize: 13, color: colors.textMuted },
  summaryVal:       { fontSize: 13, fontWeight: '600', color: colors.text, flex: 1, textAlign: 'right' },
  summaryFee:       { fontSize: 16, fontWeight: '800', color: colors.secondary },

  // Book button
  bookBtn:          { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  bookBtnDisabled:  { opacity: 0.5 },
  bookBtnText:      { color: '#fff', fontSize: 16, fontWeight: '700' },
});
