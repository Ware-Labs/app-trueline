import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

export default function ReasoningScreen() {
  const [scenarios, setScenarios] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    setLoading(true);
    try {
      const savedScenarios = await AsyncStorage.getItem('lastScenarios');
      const savedMetadata = await AsyncStorage.getItem('lastMetadata');
      
      if (savedScenarios) {
        setScenarios(JSON.parse(savedScenarios));
      }
      if (savedMetadata) {
        setMetadata(JSON.parse(savedMetadata));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {metadata && (
          <View style={styles.metaCard}>
            <Text style={styles.metaTitle}>Last Research Block</Text>
            <Text style={styles.metaText}>Game: {metadata.game_id}</Text>
            <Text style={styles.metaText}>Source: {metadata.book}</Text>
            <Text style={styles.metaText}>Time: {new Date(metadata.timestamp).toLocaleString()}</Text>
          </View>
        )}

        {scenarios.length > 0 ? (
          scenarios.map((scenario, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.scenarioTitle}>Scenario {index + 1}: {scenario.summary}</Text>
              <View style={styles.reasoningBox}>
                <Text style={styles.reasoningLabel}>AGENTIC LOGIC</Text>
                <Text style={styles.reasoningText}>{scenario.reasoning || "No detailed reasoning provided by the model."}</Text>
              </View>
              {scenario.explanation && (
                <Text style={styles.additionalInfo}>{scenario.explanation}</Text>
              )}
            </View>
          ))
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>No Research Data</Text>
            <Text style={styles.placeholderText}>
              Initiate a prediction on the Predictions tab to see the detailed research and reasoning behind the model's choices.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  container: { flex: 1 },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  metaCard: {
    backgroundColor: '#343a40',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  metaTitle: { color: '#fff', fontSize: 14, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' },
  metaText: { color: '#adb5bd', fontSize: 12, marginBottom: 2 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    marginBottom: 16,
  },
  scenarioTitle: { fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 12 },
  reasoningBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#000',
  },
  reasoningLabel: { fontSize: 10, fontWeight: '800', color: '#6c757d', marginBottom: 6, letterSpacing: 1 },
  reasoningText: { fontSize: 13, color: '#212529', lineHeight: 20 },
  additionalInfo: { fontSize: 12, color: '#6c757d', marginTop: 12, fontStyle: 'italic' },
  placeholderText: { fontSize: 14, color: '#666', lineHeight: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
});
