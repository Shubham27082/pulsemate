import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from './src/store/authStore';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import { colors } from './src/theme';

function SplashScreen() {
  return (
    <View style={s.splash}>
      <View style={s.logoMark}>
        <Text style={s.logoEmoji}>🫀</Text>
      </View>
      <Text style={s.appName}>PulseMate</Text>
      <Text style={s.tagline}>Your health, simplified</Text>
      <ActivityIndicator color="rgba(255,255,255,0.6)" style={{ marginTop: 40 }} />
    </View>
  );
}

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
              <View style={s.toast}>
                <Text style={s.toastText}>✅ {props.text1}</Text>
              </View>
            ),
            error: (props) => (
              <View style={[s.toast, { backgroundColor: '#FEE2E2', borderLeftColor: colors.danger }]}>
                <Text style={[s.toastText, { color: colors.danger }]}>❌ {props.text1}</Text>
              </View>
            ),
          }}
        />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMark: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 20,
  },
  logoEmoji: { fontSize: 48 },
  appName:   { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  tagline:   { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 6 },
  toast: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  toastText: { fontSize: 14, fontWeight: '600', color: '#065F46' },
});
