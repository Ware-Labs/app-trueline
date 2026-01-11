import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function ScenarioBetsScreen() {
  const [game, setGame] = useState('nfl-1');
  const [risk, setRisk] = useState('Balanced');
  const [linesSource, setLinesSource] = useState('DraftKings');
  const [loading, setLoading] = useState(false);
  const [scenarios, setScenarios] = useState(null);

  const handleGenerateScenarios = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setScenarios([
        {
          id: 1,
          probability: 0.45,
          summary: "High scoring game dominated by offense. Model suggests Chiefs will exploit Eagles secondary in the second half.",
          best_bet: {
            wager: "Over 45.5",
            odds: "-110",
            implied_prob: 0.52,
            model_edge: 0.07
          },
          quarter_spread_parlay: ["Q1: +3.5", "Q2: -2.5", "Q3: +1.5", "Q4: -0.5"]
        },
        {
          id: 2,
          probability: 0.35,
          summary: "Defensive struggle with low red zone efficiency. Eagles ground game controls the clock effectively.",
          best_bet: {
            wager: "Under 45.5",
            odds: "-110",
            implied_prob: 0.48,
            model_edge: 0.03
          },
          explanation: "Quarter spread parlay not available for low-scoring projections."
        },
        {
          id: 3,
          probability: 0.20,
          summary: "Lopsided victory for the home team. Early turnovers by Chiefs lead to insurmountable Eagles lead.",
          best_bet: {
            wager: "Eagles -7.5",
            odds: "+105",
            implied_prob: 0.49,
            model_edge: 0.04
          },
          quarter_spread_parlay: ["Q1: -0.5", "Q2: -3.5", "Q3: -1.5", "Q4: -2.5"]
        }
      ]);
      setLoading(false);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Parameters</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Game</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={game}
                onValueChange={(itemValue) => setGame(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="NFL: Chiefs vs Eagles" value="nfl-1" />
                <Picker.Item label="NBA: Lakers vs Celtics" value="nba-1" />
                <Picker.Item label="MLB: Dodgers vs Yankees" value="mlb-1" />
              </Picker>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Risk Profile</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={risk}
                  onValueChange={(itemValue) => setRisk(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Conservative" value="Conservative" />
                  <Picker.Item label="Balanced" value="Balanced" />
                  <Picker.Item label="Aggressive" value="Aggressive" />
                </Picker>
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Lines Source</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={linesSource}
                  onValueChange={(itemValue) => setLinesSource(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="DraftKings" value="DraftKings" />
                  <Picker.Item label="FanDuel" value="FanDuel" />
                  <Picker.Item label="BetMGM" value="BetMGM" />
                </Picker>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.generateBtn, loading && styles.disabledBtn]} 
            onPress={handleGenerateScenarios}
            disabled={loading}
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
              Lines as of: {new Date().toLocaleTimeString()} • {linesSource}
            </Text>

            {scenarios.map((scenario) => (
              <View key={scenario.id} style={styles.scenarioCard}>
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
                  <View style={styles.edgeRow}>
                    <Text style={styles.edgeText}>Model Edge: {(scenario.best_bet.model_edge * 100).toFixed(1)}%</Text>
                    <Text style={styles.edgeText}>Implied: {(scenario.best_bet.implied_prob * 100).toFixed(1)}%</Text>
                  </View>
                </View>

                <View style={styles.parlayContainer}>
                  <Text style={styles.subLabel}>Quarter Spread Parlay</Text>
                  {scenario.quarter_spread_parlay ? (
                    <View style={styles.parlayGrid}>
                      {scenario.quarter_spread_parlay.map((leg, index) => (
                        <View key={index} style={styles.parlayLeg}>
                          <Text style={styles.parlayLegText}>{leg}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.explanationText}>{scenario.explanation}</Text>
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
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#f1f3f5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  generateBtn: {
    backgroundColor: '#000',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  generateBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  resultsContainer: {
    marginTop: 10,
  },
  metaInfo: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
    marginTop: -12,
  },
  scenarioCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  scenarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  probabilityText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
  summaryText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 16,
  },
  bestBetContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  bestBetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bestBetWager: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  bestBetOdds: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2b9348',
  },
  edgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  edgeText: {
    fontSize: 12,
    color: '#666',
  },
  parlayContainer: {
    marginTop: 4,
  },
  parlayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  parlayLeg: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    margin: 4,
  },
  parlayLegText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
  },
  explanationText: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
  },
});
