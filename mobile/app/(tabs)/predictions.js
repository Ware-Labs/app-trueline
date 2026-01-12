import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '../../config';

const API_BASE_URL = Config.API_BASE_URL;

export default function PredictionsScreen() {
  const [games, setGames] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [risk, setRisk] = useState('Balanced (5% Units)');
  const [linesSource, setLinesSource] = useState('The Odds API (DraftKings)');
  const [loading, setLoading] = useState(false);
  const [loadingGames, setLoadingGames] = useState(true);
  const [scenarios, setScenarios] = useState(null);
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    fetchGames();
    loadLastScenarios();
  }, []);

  const loadLastScenarios = async () => {
    try {
      const saved = await AsyncStorage.getItem('lastScenarios');
      const meta = await AsyncStorage.getItem('lastMetadata');
      if (saved) {
        setScenarios(JSON.parse(saved));
      }
      if (meta) {
        setMetadata(JSON.parse(meta));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchGames = async () => {
    setLoadingGames(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(`${API_BASE_URL}/games`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server returned ${response.status}`);
      }
      const data = await response.json();
      setGames(data);
      if (data.length > 0) {
        setSelectedGameId(data[0].id);
      }
    } catch (error) {
      console.error(error);
      const msg = error.name === 'AbortError' ? 'Request timed out' : error.message;
      Alert.alert('Backend Error', msg);
    } finally {
      setLoadingGames(false);
    }
  };

  const handleGenerateScenarios = async () => {
    if (!selectedGameId) {
      Alert.alert('Error', 'Please select a game first.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/generate-scenarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: selectedGameId,
          risk_profile: risk,
          lines_source: linesSource,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to generate scenarios');
      const data = await response.json();
      setScenarios(data.scenarios);
      
      // Save for Reasoning tab
      await AsyncStorage.setItem('lastScenarios', JSON.stringify(data.scenarios));
      await AsyncStorage.setItem('lastMetadata', JSON.stringify({
        game_id: selectedGameId,
        timestamp: data.lines_timestamp,
        book: data.book_used
      }));
      
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to generate predictions. Check backend and API keys.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Parameters</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Game</Text>
            <View style={styles.pickerContainer}>
              {loadingGames ? (
                <ActivityIndicator style={{ padding: 15 }} />
              ) : (
                <Picker
                  selectedValue={selectedGameId}
                  onValueChange={(itemValue) => setSelectedGameId(itemValue)}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  {games.map((g) => (
                    <Picker.Item key={g.id} label={`${g.name} (${g.game_type})`} value={g.id} />
                  ))}
                  {games.length === 0 && <Picker.Item label="No upcoming games found" value="" />}
                </Picker>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Risk Profile</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={risk}
                onValueChange={(itemValue) => setRisk(itemValue)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="Conservative (2% Units)" value="Conservative (2% Units)" />
                <Picker.Item label="Balanced (5% Units)" value="Balanced (5% Units)" />
                <Picker.Item label="Aggressive (10% Units)" value="Aggressive (10% Units)" />
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Lines Source</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={linesSource}
                onValueChange={(itemValue) => setLinesSource(itemValue)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="The Odds API (DraftKings)" value="The Odds API (DraftKings)" />
                <Picker.Item label="FanDuel (Inactive)" value="FanDuel" />
                <Picker.Item label="BetMGM (Inactive)" value="BetMGM" />
                <Picker.Item label="Pinnacle (Inactive)" value="Pinnacle" />
              </Picker>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.generateBtn, (loading || loadingGames) && styles.disabledBtn]} 
            onPress={handleGenerateScenarios}
            disabled={loading || loadingGames}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.generateBtnText}>GENERATE 3 SCENARIOS</Text>
            )}
          </TouchableOpacity>
        </View>

        {scenarios && (
          <View style={styles.resultsContainer}>
            <Text style={styles.sectionTitle}>Generated Scenarios</Text>
            <Text style={styles.metaInfo}>
              Lines as of: {metadata ? new Date(metadata.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()} • {metadata ? metadata.book : linesSource}
            </Text>

            {scenarios.map((scenario, index) => (
              <View key={index} style={styles.scenarioCard}>
                <View style={styles.scenarioHeader}>
                  <Text style={styles.probabilityText}>{(scenario.probability * 100).toFixed(0)}% Probability</Text>
                </View>
                
                <Text style={styles.summaryText}>{scenario.summary}</Text>
                
                <View style={styles.bestBetContainer}>
                  <Text style={styles.subLabel}>Best Bet</Text>
                  <View style={styles.bestBetRow}>
                    <Text style={styles.bestBetWager}>{scenario.best_bet.wager}</Text>
                    <Text style={styles.bestBetOdds}>{scenario.best_bet.odds}</Text>
                  </View>
                </View>

                <View style={styles.parlayContainer}>
                  <Text style={styles.subLabel}>Quarter Spread Parlay</Text>
                  {scenario.quarter_spread_parlay ? (
                    <View style={styles.parlayGrid}>
                      {scenario.quarter_spread_parlay.map((leg, i) => (
                        <View key={i} style={styles.parlayLeg}>
                          <Text style={styles.parlayLegText}>{leg}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.explanationText}>{scenario.explanation || "No parlay recommended for this scenario."}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  container: { flex: 1 },
  content: { padding: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#000', marginBottom: 16, letterSpacing: -0.5 },
  inputGroup: { marginBottom: 16 },
  row: { flexDirection: 'row' },
  label: { fontSize: 13, fontWeight: '700', color: '#444', marginBottom: 8 },
  pickerContainer: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#e1e4e8', 
    overflow: 'hidden',
  },
  picker: { 
    width: '100%',
    ...Platform.select({
      ios: {
        height: 140,
      },
      android: {
        height: 50,
      }
    }),
  },
  pickerItem: {
    fontSize: 15,
    height: Platform.OS === 'ios' ? 140 : 50,
    color: '#000',
  },
  generateBtn: { backgroundColor: '#000', borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  disabledBtn: { opacity: 0.7 },
  generateBtnText: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
  resultsContainer: { marginTop: 4 },
  metaInfo: { fontSize: 11, color: '#999', marginBottom: 12, marginTop: -8 },
  scenarioCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  scenarioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  probabilityText: { fontSize: 15, fontWeight: '800', color: '#000' },
  summaryText: { fontSize: 13, color: '#444', lineHeight: 18, marginBottom: 12 },
  bestBetContainer: { backgroundColor: '#f8f9fa', borderRadius: 10, padding: 10, marginBottom: 10 },
  subLabel: { fontSize: 10, fontWeight: '700', color: '#999', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 },
  bestBetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  bestBetWager: { fontSize: 15, fontWeight: '700', color: '#000' },
  bestBetOdds: { fontSize: 15, fontWeight: '700', color: '#2b9348' },
  edgeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  edgeText: { fontSize: 11, color: '#666' },
  parlayContainer: { marginTop: 2 },
  parlayGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  parlayLeg: { backgroundColor: '#e9ecef', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, margin: 4 },
  parlayLegText: { fontSize: 11, fontWeight: '600', color: '#495057' },
  explanationText: { fontSize: 12, color: '#888', fontStyle: 'italic' },
});
