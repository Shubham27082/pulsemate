// ─────────────────────────────────────────────────────────────────────────────
//  MainNavigator — PulseMate Connect  |  Bottom Tab + Stack Navigation
// ─────────────────────────────────────────────────────────────────────────────
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { useRef, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen            from '../screens/HomeScreen';
import SearchScreen          from '../screens/SearchScreen';
import DoctorDetailScreen    from '../screens/DoctorDetailScreen';
import BookingScreen         from '../screens/BookingScreen';
import AppointmentsScreen    from '../screens/AppointmentsScreen';
import AppointmentDetail     from '../screens/AppointmentDetailScreen';
import LiveQueueScreen       from '../screens/LiveQueueScreen';
import PrescriptionsScreen   from '../screens/PrescriptionsScreen';
import PrescriptionDetail    from '../screens/PrescriptionDetailScreen';
import PaymentsScreen        from '../screens/PaymentsScreen';
import ProfileScreen         from '../screens/ProfileScreen';
import EditProfileScreen     from '../screens/EditProfileScreen';
import ProfileWizardScreen   from '../screens/ProfileWizardScreen';
import NotificationsScreen   from '../screens/NotificationsScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Brand tokens
const SKY5  = '#0EA5E9';
const SKY6  = '#0284C7';
const SLATE = '#0F172A';
const MUTED = '#94A3B8';
const WHITE = '#FFFFFF';

// ── Stack navigators ──────────────────────────────────────────────────────────
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Home"          component={HomeScreen} />
      <Stack.Screen name="Search"        component={SearchScreen} />
      <Stack.Screen name="DoctorDetail"  component={DoctorDetailScreen} />
      <Stack.Screen name="Booking"       component={BookingScreen} />
      <Stack.Screen name="LiveQueue"     component={LiveQueueScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

function SearchStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="SearchMain"   component={SearchScreen} />
      <Stack.Screen name="DoctorDetail" component={DoctorDetailScreen} />
      <Stack.Screen name="Booking"      component={BookingScreen} />
      <Stack.Screen name="LiveQueue"    component={LiveQueueScreen} />
    </Stack.Navigator>
  );
}

function AppointmentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Appointments"      component={AppointmentsScreen} />
      <Stack.Screen name="AppointmentDetail" component={AppointmentDetail} />
      <Stack.Screen name="LiveQueue"         component={LiveQueueScreen} />
    </Stack.Navigator>
  );
}

function PrescriptionsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Prescriptions"      component={PrescriptionsScreen} />
      <Stack.Screen name="PrescriptionDetail" component={PrescriptionDetail} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Profile"        component={ProfileScreen} />
      <Stack.Screen name="EditProfile"    component={EditProfileScreen} />
      <Stack.Screen name="ProfileWizard"  component={ProfileWizardScreen} />
      <Stack.Screen name="Payments"       component={PaymentsScreen} />
      <Stack.Screen name="Notifications"  component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { name: 'HomeTab',         label: 'Home',    icon: 'home',          component: HomeStack         },
  { name: 'DoctorsTab',      label: 'Doctors', icon: 'person',        component: SearchStack       },
  { name: 'AppointmentsTab', label: 'Appts',   icon: 'calendar',      component: AppointmentsStack },
  { name: 'RecordsTab',      label: 'Records', icon: 'folder',        component: PrescriptionsStack },
  { name: 'ProfileTab',      label: 'Profile', icon: 'person-circle', component: ProfileStack      },
];
// ── Custom tab bar button ─────────────────────────────────────────────────────
function TabButton({ tab, focused, onPress }) {
  const scaleA = useRef(new Animated.Value(1)).current;
  const dotA   = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(dotA, {
      toValue: focused ? 1 : 0,
      friction: 6, tension: 100,
      useNativeDriver: true,
    }).start();
    if (focused) {
      Animated.sequence([
        Animated.timing(scaleA, { toValue: 0.88, duration: 80, useNativeDriver: true }),
        Animated.spring(scaleA, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
      ]).start();
    }
  }, [focused]);

  const iconName = focused ? tab.icon : `${tab.icon}-outline`;
  const iconColor = focused ? SKY5 : MUTED;

  return (
    <TouchableOpacity
      style={tb.tabBtn}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Animated.View style={[tb.tabInner, { transform: [{ scale: scaleA }] }]}>
        {/* Active pill background */}
        <Animated.View style={[
          tb.activePill,
          {
            opacity: dotA,
            transform: [{ scaleX: dotA.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
          },
        ]} />

        {/* Icon */}
        <Ionicons name={iconName} size={22} color={iconColor} />

        {/* Label */}
        <Text style={[tb.tabLabel, focused && tb.tabLabelActive]} numberOfLines={1}>
          {tab.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── Custom tab bar ────────────────────────────────────────────────────────────
function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[tb.bar, { paddingBottom: insets.bottom + 6 }]}>
      {/* Top border glow */}
      <View style={tb.topGlow} />

      <View style={tb.tabRow}>
        {state.routes.map((route, index) => {
          const tab     = TABS.find((t) => t.name === route.name);
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabButton
              key={route.key}
              tab={tab}
              focused={focused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

// ── Main navigator ────────────────────────────────────────────────────────────
export default function MainNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {TABS.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{ title: tab.label }}
        />
      ))}
    </Tab.Navigator>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const tb = StyleSheet.create({
  bar: {
    backgroundColor: WHITE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  topGlow: {
    height: 1,
    backgroundColor: '#E0F2FE',
  },
  tabRow: {
    flexDirection: 'row',
    paddingTop: 6,
    paddingHorizontal: 2,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderRadius: 12,
    gap: 2,
    width: '100%',
  },
  activePill: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: MUTED,
    letterSpacing: 0,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: SKY5,
    fontWeight: '700',
  },
});
