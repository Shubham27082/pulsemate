import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen    from '../screens/WelcomeScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen      from '../screens/LoginScreen';
import OtpScreen        from '../screens/OtpScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Splash / welcome — shown first */}
      <Stack.Screen name="Welcome"    component={WelcomeScreen}    />
      {/* 4-slide feature onboarding */}
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      {/* Auth flow */}
      <Stack.Screen name="Login"      component={LoginScreen}      />
      <Stack.Screen name="Otp"        component={OtpScreen}        />
    </Stack.Navigator>
  );
}
