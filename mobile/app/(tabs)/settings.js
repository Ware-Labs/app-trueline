import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '../../config';

const API_BASE_URL = Config.API_BASE_URL;

export default function SettingsScreen() {
  const [debugOutput, setDebugOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userSession');
              router.replace('/');
            } catch (e) {
              Alert.alert('Error', 'Failed to log out');
            }
          }
        }
      ]
    );
  };

  const exerciseApi = async (endpoint) => {
    setLoading(true);
    setDebugOutput(`Calling ${endpoint}...`);
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      const data = await response.json();
      setDebugOutput(JSON.stringify(data, null, 2));
    } catch (error) {
      setDebugOutput(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <Text style={styles.label}>Prediction Model</Text>
          <View style={styles.placeholderBox}><Text style={styles.valueText}>GPT-5.2</Text></View>
          
          <Text style={[styles.label, { marginTop: 16 }]}>Core Data Sources</Text>
          <View style={styles.placeholderBox}><Text style={styles.valueText}>nflverse, The Odds API (DraftKings)</Text></View>
        </View>

        <View style={[styles.card, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>Developer Tools</Text>
          
          <View style={styles.buttonGrid}>
            <TouchableOpacity 
              style={styles.devButton}
              onPress={() => exerciseApi('/games')}
              disabled={loading}
            >
              <Text style={styles.devButtonText}>GET GAMES</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.devButton}
              onPress={() => exerciseApi('/odds?game_id=test')}
              disabled={loading}
            >
              <Text style={styles.devButtonText}>GET ODDS</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.devButton, { backgroundColor: '#6c757d' }]}
            onPress={() => setDebugOutput('')}
          >
            <Text style={styles.devButtonText}>CLEAR OUTPUT</Text>
          </TouchableOpacity>

          {loading && <ActivityIndicator style={{ marginVertical: 10 }} color="#000" />}

          {debugOutput !== '' && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>RAW API OUTPUT</Text>
              <ScrollView style={styles.debugScroll} nestedScrollEnabled={true}>
                <Text style={styles.debugText}>{debugOutput}</Text>
              </ScrollView>
            </View>
          )}
        </View>

        <View style={[styles.card, { marginTop: 20, marginBottom: 40 }]}>
          <Text style={styles.sectionTitle}>System Status</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Backend API:</Text>
            <Text style={styles.statusValue}>Connected</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>OpenAI Key:</Text>
            <Text style={styles.statusValue}>Configured (sk-...)</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Odds API Key:</Text>
            <Text style={styles.statusValue}>Configured</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>LOG OUT</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  container: { flex: 1 },
  content: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
  },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
  valueText: { fontSize: 14, color: '#212529' },
  placeholderBox: {
    backgroundColor: '#f1f3f5',
    padding: 12,
    borderRadius: 8,
  },
  buttonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  devButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devButtonText: { color: '#fff', fontWeight: '700', fontSize: 11, letterSpacing: 0.5 },
  debugContainer: {
    marginTop: 20,
    backgroundColor: '#212529',
    borderRadius: 8,
    padding: 12,
    maxHeight: 300,
  },
  debugTitle: { color: '#adb5bd', fontSize: 10, fontWeight: '800', marginBottom: 8 },
  debugScroll: { flexGrow: 0 },
  debugText: { color: '#20c997', fontFamily: 'monospace', fontSize: 11 },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  statusLabel: { fontSize: 13, color: '#666' },
  statusValue: { fontSize: 13, fontWeight: '600', color: '#2b9348' },
  logoutButton: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#ff4d4d',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  logoutButtonText: {
    color: '#ff4d4d',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1,
  },
});
