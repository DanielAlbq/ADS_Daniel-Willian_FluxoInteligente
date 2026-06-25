import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import Markdown from 'react-native-markdown-display';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export default function InsightsScreen({ navigation }) {
    const [insight, setInsight] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        gerarInsight();
    }, []);

    const gerarInsight = async () => {
        try {
            setLoading(true);

            const token = await AsyncStorage.getItem('@FluxoInteligente:token');

            if (!token) {
                setInsight('Erro: Usuário não autenticado.');
                setLoading(false);
                return;
            }
            const urlDaIA = `${API_BASE_URL}/insights/gerar`;
            console.log("Disparando IA para a URL:", urlDaIA);

            const response = await fetch(urlDaIA, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log("📥 Status retornado pela IA:", response.status);

            if (response.ok) {
                const dados = await response.json();
                setInsight(dados.insight);
            } else {
                setInsight(`❌ Erro do Servidor: Status ${response.status}`);
            }

        } catch (error) {
            setInsight(' Erro de conexão.');
            console.error("Erro no Fetch (Insights):", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Consultoria IA </Text>
                <Text style={styles.subtitle}>Sua análise financeira inteligente</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2e7d32" />
                    <Text style={styles.loadingText}>O assistente está analisando seus dados...</Text>
                </View>
            ) : (
                <View style={styles.cardIa}>
                    {insight ? (
                        <Markdown style={markdownStyles}>
                            {String(insight)}
                        </Markdown>
                    )
                        : (
                            <Text style={styles.loadingText}>Nenhum insight gerado no momento.</Text>
                        )}

                    <TouchableOpacity
                        style={{ backgroundColor: '#2e7d32', padding: 15, borderRadius: 10, marginTop: 20, alignItems: 'center' }}
                        onPress={() => navigation.navigate("ChatScreen", { insightInicial: insight })}
                    >
                        <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>
                            Falar com o Consultor
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
    },
    header: {
        marginBottom: 20,
        alignItems: 'center',
        marginTop: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2e7d32',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    loadingContainer: {
        marginTop: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    cardIa: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        marginBottom: 30,
    },

    chatButton: {
        backgroundColor: '#2e7d32',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,

        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    chatButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

const markdownStyles = {
    body: {
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
    },
    heading2: {
        color: '#2e7d32',
        marginTop: 10,
        marginBottom: 10,
    },
    strong: {
        fontWeight: 'bold',
        color: '#000',
    },

};