import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const handleBookRide = () => {
    Alert.alert('Ride Booked!', 'Your ride has been successfully booked. Driver will arrive in 3 minutes.');
  };

  const handleDriveEarn = () => {
    Alert.alert('Driver Mode', 'Driver features coming soon!');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.brandText}>ride</Text>
        <Text style={styles.taglineText}>Premium rideshare reimagined</Text>
      </View>

      {/* Main Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.actionButton, styles.primaryButton]} onPress={handleBookRide}>
          <Text style={styles.buttonIcon}>🚗</Text>
          <Text style={styles.buttonTitle}>Book a ride</Text>
          <Text style={styles.buttonDescription}>Quick, safe, and affordable transportation</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={handleDriveEarn}>
          <Text style={[styles.buttonIcon, styles.secondaryIcon]}>💰</Text>
          <Text style={[styles.buttonTitle, styles.secondaryText]}>Drive & Earn</Text>
          <Text style={[styles.buttonDescription, styles.secondaryText]}>Join our premium driver network</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>🌟 Trillion-Dollar Technology</Text>
        <Text style={styles.footerSubtext}>Available in MS, TN and expanding</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 24,
    paddingVertical: 50,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
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
    gap: 20,
  },
  actionButton: {
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    minHeight: 180,
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
  buttonIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  secondaryIcon: {
    fontSize: 56,
  },
  buttonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  secondaryText: {
    color: '#3B82F6',
  },
  buttonDescription: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#64748b',
  },
});