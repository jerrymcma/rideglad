import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TripTrackingScreen = ({ navigation, route }: any) => {
  const { pickup, destination } = route.params;
  const [tripStatus, setTripStatus] = useState<'matched' | 'pickup' | 'inprogress'>('matched');
  const [estimatedTime, setEstimatedTime] = useState(3);

  useEffect(() => {
    // Simulate trip progression
    const timer1 = setTimeout(() => setTripStatus('pickup'), 3000);
    const timer2 = setTimeout(() => setTripStatus('inprogress'), 8000);
    const timer3 = setTimeout(() => {
      navigation.navigate('TripCompleted', { pickup, destination });
    }, 15000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const handleCallDriver = () => {
    Alert.alert(
      'Call Driver',
      'Would you like to call John?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => {
            // In a real app, you would use the driver's actual phone number
            Linking.openURL('tel:+1234567890');
          }
        },
      ]
    );
  };

  const handleMessageDriver = () => {
    Alert.alert('Message Sent', 'Your message has been sent to the driver.');
  };

  const getStatusInfo = () => {
    switch (tripStatus) {
      case 'matched':
        return {
          title: 'Driver Found!',
          subtitle: 'Your driver is on the way!',
          color: '#16c4a3',
        };
      case 'pickup':
        return {
          title: 'Driver Arriving',
          subtitle: 'Your driver is arriving at pickup location',
          color: '#f59e0b',
        };
      case 'inprogress':
        return {
          title: 'Trip in Progress',
          subtitle: 'Enjoy your ride!',
          color: '#3B82F6',
        };
      default:
        return {
          title: 'Driver Found!',
          subtitle: 'Your driver is on the way!',
          color: '#16c4a3',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Status Header */}
        <View style={styles.statusHeader}>
          <Text style={[styles.statusTitle, { color: statusInfo.color }]}>
            {statusInfo.title}
          </Text>
          <Text style={styles.statusSubtitle}>
            {statusInfo.subtitle}
          </Text>
        </View>

        {/* Map Container */}
        <View style={styles.mapContainer}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Live Tracking</Text>
          </View>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="car" size={64} color="#3B82F6" />
            <Text style={styles.mapText}>Real-time driver tracking</Text>
            <Text style={styles.estimatedTime}>{estimatedTime} min away</Text>
          </View>
        </View>

        {/* Driver Info */}
        <View style={styles.driverCard}>
          <View style={styles.driverHeader}>
            <View style={styles.driverInfo}>
              <View style={styles.driverAvatar}>
                <Ionicons name="person" size={28} color="#64748b" />
              </View>
              <View style={styles.driverDetails}>
                <View style={styles.driverNameRow}>
                  <Text style={styles.driverName}>John Driver</Text>
                  <View style={styles.statusBadge}>
                    <Ionicons name="trophy" size={16} color="#f59e0b" />
                    <Text style={styles.statusText}>Gold Status</Text>
                  </View>
                </View>
                <View style={styles.driverRating}>
                  <Ionicons name="star" size={16} color="#f59e0b" />
                  <Text style={styles.ratingText}>4.8 (150 rides)</Text>
                  <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />
                  <Text style={styles.certifiedText}>ride Certified</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Vehicle Info */}
          <View style={styles.vehicleInfo}>
            <View style={styles.vehicleDetails}>
              <Text style={styles.vehicleLabel}>Vehicle:</Text>
              <Text style={styles.vehicleText}>Silver Toyota Camry</Text>
            </View>
            <View style={styles.vehicleDetails}>
              <Text style={styles.vehicleLabel}>License:</Text>
              <Text style={styles.vehicleText}>ABC123</Text>
            </View>
            <View style={styles.vehicleDetails}>
              <Text style={styles.vehicleLabel}>ETA:</Text>
              <Text style={styles.vehicleText}>{estimatedTime} minutes</Text>
            </View>
          </View>

          {/* Trip Details */}
          <View style={styles.tripDetails}>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color="#3B82F6" />
              <Text style={styles.locationLabel}>Pickup:</Text>
              <Text style={styles.locationText}>{pickup}</Text>
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="navigation" size={16} color="#16c4a3" />
              <Text style={styles.locationLabel}>Destination:</Text>
              <Text style={styles.locationText}>{destination}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCallDriver}>
              <Ionicons name="call" size={20} color="white" />
              <Text style={styles.actionButtonText}>Call Driver</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleMessageDriver}>
              <Ionicons name="chatbubble" size={20} color="white" />
              <Text style={styles.actionButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingTop: 16,
  },
  statusHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748b',
  },
  mapContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mapHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
    textAlign: 'center',
  },
  mapPlaceholder: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mapText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  estimatedTime: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  driverCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  driverHeader: {
    marginBottom: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  driverDetails: {
    flex: 1,
  },
  driverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
    marginLeft: 4,
  },
  driverRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    marginRight: 12,
  },
  certifiedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 4,
  },
  vehicleInfo: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  vehicleDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vehicleLabel: {
    fontSize: 14,
    color: '#64748b',
    width: 80,
  },
  vehicleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  tripDetails: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 8,
    minWidth: 80,
  },
  locationText: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default TripTrackingScreen;