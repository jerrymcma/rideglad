import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = ({ navigation }: any) => {
  const handleBookRide = () => {
    navigation.navigate('RideBooking');
  };

  const handleDriveAndEarn = () => {
    // TODO: Navigate to driver app or show coming soon
    console.log('Drive & Earn coming soon');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.brandText}>ride</Text>
          <Text style={styles.taglineText}>Premium rideshare reimagined</Text>
        </View>

        {/* Main Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleBookRide}
          >
            <Ionicons name="car" size={56} color="white" />
            <Text style={styles.buttonTitle}>Book a ride</Text>
            <Text style={styles.buttonDescription}>
              Quick, safe, and affordable transportation
            </Text>
          </TouchableOpacity>

          <View style={styles.buttonSpacing} />

          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleDriveAndEarn}
          >
            <Ionicons name="cash-outline" size={56} color="#3B82F6" />
            <Text style={[styles.buttonTitle, styles.secondaryButtonText]}>Drive & Earn</Text>
            <Text style={[styles.buttonDescription, styles.secondaryButtonText]}>
              Join our premium driver network
            </Text>
          </TouchableOpacity>
        </View>

        {/* Social Media Links */}
        <View style={styles.socialContainer}>
          <Text style={styles.socialTitle}>Follow us</Text>
          <View style={styles.socialIcons}>
            <TouchableOpacity style={styles.socialIcon}>
              <Ionicons name="logo-facebook" size={28} color="#1877F2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Ionicons name="logo-twitter" size={28} color="#1DA1F2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Ionicons name="logo-instagram" size={28} color="#E4405F" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Ionicons name="logo-tiktok" size={28} color="#000000" />
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
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  welcomeText: {
    fontSize: 24,
    color: '#64748b',
    marginBottom: 8,
  },
  brandText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 16,
  },
  taglineText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 40,
  },
  actionButton: {
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    minHeight: 160,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  buttonSpacing: {
    height: 20,
  },
  buttonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
    marginBottom: 8,
  },
  secondaryButtonText: {
    color: '#3B82F6',
  },
  buttonDescription: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
  },
  socialContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  socialTitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialIcon: {
    padding: 8,
  },
});

export default HomeScreen;