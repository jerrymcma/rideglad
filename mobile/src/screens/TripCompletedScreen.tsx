import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TripCompletedScreen = ({ navigation, route }: any) => {
  const { pickup, destination } = route.params;
  const [rating, setRating] = useState(5);

  const handleSubmitRating = () => {
    Alert.alert('Thank you!', 'Your rating has been submitted.');
    setTimeout(() => {
      navigation.navigate('Home');
    }, 1000);
  };

  const handleBookAnother = () => {
    navigation.navigate('RideBooking');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Completion Header */}
        <View style={styles.header}>
          <Text style={styles.completedTitle}>Trip Completed!</Text>
          <View style={styles.thankYouCard}>
            <Text style={styles.thankYouText}>Thank you for choosing ride.</Text>
            <Text style={styles.lookForwardText}>We look forward to serving you soon.</Text>
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Trip Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fare:</Text>
            <Text style={styles.detailValue}>$24.90</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Distance:</Text>
            <Text style={styles.detailValue}>2.0 mi</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>18 min</Text>
          </View>
        </View>

        {/* Rating Section */}
        <View style={styles.ratingCard}>
          <Text style={styles.ratingTitle}>Rate Your Driver</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={36}
                  color={star <= rating ? '#f59e0b' : '#d1d5db'}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingText}>
            {rating === 5 ? 'Excellent!' : rating >= 4 ? 'Good' : rating >= 3 ? 'Average' : 'Poor'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmitRating}>
            <Text style={styles.submitButtonText}>Submit Rating</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.bookAnotherButton} onPress={handleBookAnother}>
            <Text style={styles.bookAnotherText}>Book Another Ride</Text>
          </TouchableOpacity>
        </View>

        {/* Driver Info */}
        <View style={styles.driverCard}>
          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <Ionicons name="person" size={24} color="#64748b" />
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>John Driver</Text>
              <View style={styles.driverRating}>
                <Ionicons name="star" size={16} color="#f59e0b" />
                <Text style={styles.driverRatingText}>4.8 (150 rides)</Text>
              </View>
            </View>
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleText}>Silver Toyota Camry • ABC123</Text>
          </View>
        </View>

        {/* Trip Route */}
        <View style={styles.routeCard}>
          <View style={styles.routeItem}>
            <View style={styles.routeIcon}>
              <Ionicons name="location" size={16} color="#3B82F6" />
            </View>
            <View style={styles.routeDetails}>
              <Text style={styles.routeLabel}>From</Text>
              <Text style={styles.routeAddress}>{pickup}</Text>
            </View>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeItem}>
            <View style={styles.routeIcon}>
              <Ionicons name="navigation" size={16} color="#16c4a3" />
            </View>
            <View style={styles.routeDetails}>
              <Text style={styles.routeLabel}>To</Text>
              <Text style={styles.routeAddress}>{destination}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    paddingTop: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  completedTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#16c4a3',
    marginBottom: 16,
  },
  thankYouCard: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginHorizontal: 16,
  },
  thankYouText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    textAlign: 'center',
    marginBottom: 4,
  },
  lookForwardText: {
    fontSize: 14,
    color: '#1e40af',
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
    textAlign: 'center',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#16c4a3',
  },
  ratingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  actionButtons: {
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  bookAnotherButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  bookAnotherText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  driverCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  driverRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverRatingText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  vehicleInfo: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  vehicleText: {
    fontSize: 14,
    color: '#64748b',
  },
  routeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeDetails: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  routeAddress: {
    fontSize: 14,
    color: '#1e293b',
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: '#e2e8f0',
    marginLeft: 15,
    marginVertical: 8,
  },
});

export default TripCompletedScreen;