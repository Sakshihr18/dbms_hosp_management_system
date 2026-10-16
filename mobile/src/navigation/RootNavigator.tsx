import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme/theme';

// Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { BookAppointmentScreen } from '../screens/booking/BookAppointmentScreen';
import { AppointmentsScreen } from '../screens/appointments/AppointmentsScreen';
import { BillsScreen } from '../screens/payments/BillsScreen';
import { PaymentScreen } from '../screens/payments/PaymentScreen';
import { ReceiptScreen } from '../screens/payments/ReceiptScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 1,
          shadowOpacity: 0.05,
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
          color: theme.colors.text,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'ellipse';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Book Appointment') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'My Appointments') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Bills and Payments') {
            iconName = focused ? 'card' : 'card-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{ title: 'CareHub Home' }}
      />
      <Tab.Screen
        name="Book Appointment"
        component={BookAppointmentScreen}
        options={{ title: 'Book Doctor' }}
      />
      <Tab.Screen
        name="My Appointments"
        component={AppointmentsScreen}
        options={{ title: 'My Visits' }}
      />
      <Tab.Screen
        name="Bills and Payments"
        component={BillsScreen}
        options={{ title: 'Invoices & UPI' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'My Profile' }}
      />
    </Tab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

export const RootNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <RootStack.Screen name="MainTabs" component={MainTabs} />
            <RootStack.Screen
              name="PaymentModal"
              component={PaymentScreen}
              options={{
                presentation: 'modal',
                headerShown: true,
                title: 'UPI QR Payment',
                headerStyle: { backgroundColor: theme.colors.surface },
                headerTitleStyle: { fontWeight: '700', fontSize: 16 },
                headerTintColor: theme.colors.primary,
              }}
            />
            <RootStack.Screen
              name="ReceiptModal"
              component={ReceiptScreen}
              options={{
                presentation: 'modal',
                headerShown: true,
                title: 'Official Payment Receipt',
                headerStyle: { backgroundColor: theme.colors.surface },
                headerTitleStyle: { fontWeight: '700', fontSize: 16 },
                headerTintColor: theme.colors.primary,
              }}
            />
          </>
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
