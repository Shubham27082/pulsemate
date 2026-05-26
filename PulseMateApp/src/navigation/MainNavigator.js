import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../theme';

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
import NotificationsScreen   from '../screens/NotificationsScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SearchMain"   component={SearchScreen} />
      <Stack.Screen name="DoctorDetail" component={DoctorDetailScreen} />
      <Stack.Screen name="Booking"      component={BookingScreen} />
      <Stack.Screen name="LiveQueue"    component={LiveQueueScreen} />
    </Stack.Navigator>
  );
}

function AppointmentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Appointments"      component={AppointmentsScreen} />
      <Stack.Screen name="AppointmentDetail" component={AppointmentDetail} />
      <Stack.Screen name="LiveQueue"         component={LiveQueueScreen} />
    </Stack.Navigator>
  );
}

function PrescriptionsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Prescriptions"      component={PrescriptionsScreen} />
      <Stack.Screen name="PrescriptionDetail" component={PrescriptionDetail} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile"       component={ProfileScreen} />
      <Stack.Screen name="EditProfile"   component={EditProfileScreen} />
      <Stack.Screen name="Payments"      component={PaymentsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

// Custom tab bar icon with label
function TabIcon({ name, label, focused, color }) {
  return (
    <View style={tb.iconWrap}>
      <Ionicons name={name} size={22} color={color} />
      {focused && <View style={tb.activeDot} />}
    </View>
  );
}

const TABS = [
  { name: 'HomeTab',          label: 'Home',         icon: 'home',          component: HomeStack          },
  { name: 'DoctorsTab',       label: 'Doctors',      icon: 'person',        component: SearchStack        },
  { name: 'AppointmentsTab',  label: 'Appointments', icon: 'calendar',      component: AppointmentsStack  },
  { name: 'PrescriptionsTab', label: 'Records',      icon: 'document-text', component: PrescriptionsStack },
  { name: 'ProfileTab',       label: 'Profile',      icon: 'person-circle', component: ProfileStack       },
];

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tab = TABS.find((t) => t.name === route.name);
        return {
          headerShown: false,
          tabBarActiveTintColor:   colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 0,
            height: 68,
            paddingBottom: 10,
            paddingTop: 8,
            ...shadow.md,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            marginTop: 2,
          },
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? tab.icon : `${tab.icon}-outline`}
              label={tab.label}
              focused={focused}
              color={color}
            />
          ),
        };
      }}
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

const tb = StyleSheet.create({
  iconWrap:  { alignItems: 'center', justifyContent: 'center' },
  activeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 3 },
});
