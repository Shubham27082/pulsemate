import { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { updatePatientProfile } from '../api/patient';
import { useAuth } from '../store/authStore';
import { colors } from '../theme';

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

export default function EditProfileScreen({ route, navigation }) {
  const { profile } = route.params || {};
  const { updateUser } = useAuth();
  const p = profile?.patientProfile;

  const [form, setForm] = useState({
    name:             profile?.name || '',
    gender:           p?.gender || '',
    dob:              p?.dob ? p.dob.split('T')[0] : '',
    bloodGroup:       p?.bloodGroup || '',
    emergencyContact: p?.emergencyContact || '',
    allergies:        p?.allergies || '',
    existingDiseases: p?.existingDiseases || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Required', 'Name is required'); return; }
    setSaving(true);
    try {
      const res = await updatePatientProfile({
        name:             form.name || undefined,
        gender:           form.gender || undefined,
        dob:              form.dob || undefined,
        bloodGroup:       form.bloodGroup || undefined,
        emergencyContact: form.emergencyContact || undefined,
        allergies:        form.allergies || undefined,
        existingDiseases: form.existingDiseases || undefined,
      });
      updateUser({ name: res.data.data.user.name });
      Alert.alert('Saved', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
          <Text style={s.backText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Name */}
        <Text style={s.label}>Full Name <Text style={s.required}>*</Text></Text>
        <TextInput style={s.input} value={form.name} onChangeText={(v) => set('name', v)} placeholder="Your full name" placeholderTextColor={colors.textMuted} />

        {/* Gender */}
        <Text style={s.label}>Gender <Text style={s.required}>*</Text></Text>
        <View style={s.optionRow}>
          {['MALE','FEMALE','OTHER'].map((g) => (
            <TouchableOpacity
              key={g}
              style={[s.optionBtn, form.gender === g && s.optionBtnActive]}
              onPress={() => set('gender', g)}
            >
              <Text style={[s.optionText, form.gender === g && s.optionTextActive]}>
                {g === 'MALE' ? '♂ Male' : g === 'FEMALE' ? '♀ Female' : '⚧ Other'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* DOB */}
        <Text style={s.label}>Date of Birth <Text style={s.required}>*</Text></Text>
        <TextInput
          style={s.input}
          value={form.dob}
          onChangeText={(v) => set('dob', v)}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
        />

        {/* Blood Group */}
        <Text style={s.label}>Blood Group <Text style={s.required}>*</Text></Text>
        <View style={s.bloodRow}>
          {BLOOD_GROUPS.map((bg) => (
            <TouchableOpacity
              key={bg}
              style={[s.bloodBtn, form.bloodGroup === bg && s.bloodBtnActive]}
              onPress={() => set('bloodGroup', form.bloodGroup === bg ? '' : bg)}
            >
              <Text style={[s.bloodText, form.bloodGroup === bg && s.bloodTextActive]}>{bg}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Emergency Contact */}
        <Text style={s.label}>Emergency Contact <Text style={s.required}>*</Text></Text>
        <TextInput
          style={s.input}
          value={form.emergencyContact}
          onChangeText={(v) => set('emergencyContact', v)}
          placeholder="+91 9876543210"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
        />

        {/* Allergies */}
        <Text style={s.label}>Known Allergies <Text style={s.optional}>(optional)</Text></Text>
        <TextInput
          style={s.input}
          value={form.allergies}
          onChangeText={(v) => set('allergies', v)}
          placeholder="e.g. Penicillin, Dust, Peanuts"
          placeholderTextColor={colors.textMuted}
        />

        {/* Conditions */}
        <Text style={s.label}>Existing Conditions <Text style={s.optional}>(optional)</Text></Text>
        <TextInput
          style={s.input}
          value={form.existingDiseases}
          onChangeText={(v) => set('existingDiseases', v)}
          placeholder="e.g. Diabetes, Hypertension"
          placeholderTextColor={colors.textMuted}
        />

        {/* Save */}
        <TouchableOpacity
          style={[s.saveBtn, saving && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={s.saveBtnText}>Save Profile</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: colors.bg },
  content:         { padding: 20, paddingBottom: 40 },
  back:            { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  backText:        { fontSize: 18, fontWeight: '700', color: colors.text },
  label:           { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8, marginTop: 4 },
  required:        { color: colors.danger },
  optional:        { fontWeight: '400', color: colors.textMuted, fontSize: 12 },
  input:           { borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 15, color: colors.text, backgroundColor: '#fff', marginBottom: 16 },
  optionRow:       { flexDirection: 'row', gap: 10, marginBottom: 16 },
  optionBtn:       { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', backgroundColor: '#fff' },
  optionBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText:      { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  optionTextActive:{ color: '#fff' },
  bloodRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  bloodBtn:        { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#fff' },
  bloodBtnActive:  { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
  bloodText:       { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  bloodTextActive: { color: '#DC2626' },
  saveBtn:         { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },
});
