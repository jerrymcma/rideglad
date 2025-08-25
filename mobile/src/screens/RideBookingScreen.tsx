import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const RideBookingScreen = ({ navigation }: any) => {
  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to book rides.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
      
      // Reverse geocode to get address
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      if (address[0]) {
        const { street, city, region } = address[0];
        setPickupAddress(`${street}, ${city}, ${region}`);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleRequestRide = () => {
    if (!pickupAddress.trim() || !destinationAddress.trim()) {
      Alert.alert('Missing Information', 'Please enter both pickup and destination addresses.');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('TripTracking', {
        pickup: pickupAddress,
        destination: destinationAddress,
      });
    }, 1500);
  };

  const quickDestinations = [
    'Downtown Area',
    'Airport',
    'Shopping Mall',
    'University',
    'Hospital',
    'Train Station'
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Location Inputs */}
        <View style={styles.inputContainer}>
          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Ionicons name="location" size={20} color="#3B82F6" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Pickup location"
                value={pickupAddress}
                onChangeText={setPickupAddress}
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity onPress={getCurrentLocation}>
                <Ionicons name="locate" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Ionicons name="navigation" size={20} color="#16c4a3" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Where to?"
                value={destinationAddress}
                onChangeText={setDestinationAddress}
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>
        </View>

        {/* Quick Destinations */}
        <View style={styles.quickDestinations}>
          <Text style={styles.sectionTitle}>Quick destinations</Text>
          <View style={styles.destinationGrid}>
            {quickDestinations.map((destination, index) => (
              <TouchableOpacity
                key={index}
                style={styles.destinationButton}
                onPress={() => setDestinationAddress(destination)}
              >
                <Text style={styles.destinationText}>{destination}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Map Placeholder */}
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map" size={48} color="#64748b" />
            <Text style={styles.mapText}>Map will show available drivers</Text>
          </View>
        </View>

        {/* Driver Options */}
        <View style={styles.driverOptions}>
          <Text style={styles.sectionTitle}>Available drivers</Text>
          <View style={styles.driverList}>
            {['John', 'Sarah', 'Mike'].map((driver, index) => (
              <View key={index} style={styles.driverCard}>
                <View style={styles.driverInfo}>
                  <View style={styles.driverAvatar}>
                    <Ionicons name="person" size={24} color="#64748b" />
                  </View>
                  <View style={styles.driverDetails}>
                    <Text style={styles.driverName}>{driver}</Text>
                    <Text style={styles.driverEta}>3 min away</Text>
                  </View>
                </View>
                <Text style={styles.price}>$24.90</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Request Ride Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.requestButton, isLoading && styles.requestButtonDisabled]}
          onPress={handleRequestRide}
          disabled={isLoading}
        >
          <Text style={styles.requestButtonText}>
            {isLoading ? 'Finding Driver...' : 'Request Ride'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  quickDestinations: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  destinationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  destinationButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  destinationText: {
    fontSize: 14,
    color: '#64748b',
  },
  mapContainer: {
    marginBottom: 24,
  },
  mapPlaceholder: {
    backgroundColor: 'white',
    borderRadius: 12,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mapText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
  },
  driverOptions: {
    marginBottom: 24,
  },
  driverList: {
    gap: 12,
  },
  driverCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  driverEta: {
    fontSize: 14,
    color: '#64748b',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16c4a3',
  },
  bottomContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  requestButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  requestButtonDisabled: {
    opacity: 0.6,
  },
  requestButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default RideBookingScreen;