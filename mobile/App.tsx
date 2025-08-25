import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import RideBookingScreen from './src/screens/RideBookingScreen';
import TripTrackingScreen from './src/screens/TripTrackingScreen';
import TripCompletedScreen from './src/screens/TripCompletedScreen';

const Stack = createStackNavigator();
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#3B82F6',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ title: 'ride' }}
            />
            <Stack.Screen 
              name="RideBooking" 
              component={RideBookingScreen}
              options={{ title: 'Book a Ride' }}
            />
            <Stack.Screen 
              name="TripTracking" 
              component={TripTrackingScreen}
              options={{ title: 'Your Trip' }}
            />
            <Stack.Screen 
              name="TripCompleted" 
              component={TripCompletedScreen}
              options={{ title: 'Trip Complete' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}