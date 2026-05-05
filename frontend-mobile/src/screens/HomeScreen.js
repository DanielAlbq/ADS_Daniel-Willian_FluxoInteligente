import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function HomeScreen({ navigation }) {
    const [saldo, setSaldo] = useState(0);
    const [receitas, setReceitas] = useState(0);
    const [despesas, setDespesas] = useState(0);
    const [loading, setLoading] = useState(true);

    const API_URL = "http://172.30.134.193:8080/api/lancamentos/saldo";

    useFocusEffect(
        useCallback(() => {
            carregarDadosDashboard();
        }, [])
    );

    const carregarDadosDashboard = async () => {
        try {
            setLoading(true);

            // 1. Log para verificar se o Storage está funcionando
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
            console.log("--- DEBUG DASHBOARD ---");
            console.log("1. Token recuperado do AsyncStorage:", token);

            if (!token) {
                console.log("ERRO: Token não encontrado. Redirecionando para Login...");
                navigation.replace('Login');
                return;
            }

            // 2. Log antes da chamada da API
            console.log("2. Enviando requisição para:", API_URL);

            const response = await axios.get(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // 3. Log de sucesso da API
            console.log("3. Resposta da API recebida com sucesso!");

            if (typeof response.data === 'object' && response.data !== null) {
                setSaldo(response.data.saldo || 0);
                setReceitas(response.data.receitas || 0);
                setDespesas(response.data.despesas || 0);
            } else {
                setSaldo(response.data || 0);
            }
        } catch (error) {
            // 4. Log detalhado de erro
            console.log("--- ERRO NO DASHBOARD ---");
            if (error.response) {
                console.log("Status do Erro:", error.response.status);
                console.log("Dados do Erro:", error.response.data);
            } else {
                console.log("Mensagem de Erro:", error.message);
            }

            if (error.response && (error.response.status === 403 || error.response.status === 401)) {
                await AsyncStorage.removeItem('@FluxoInteligente:token');
                navigation.replace('Login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert("Sair", "Deseja realmente sair da aplicação?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Sair",
                onPress: async () => {
                    await AsyncStorage.removeItem('@FluxoInteligente:token');
                    navigation.replace('Login');
                }
            }
        ]);
    };

    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#2e7d32" />
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Olá, Empreendedor!</Text>
                        <Text style={styles.subGreeting}>Bem-vindo ao Fluxo Inteligente</Text>
                    </View>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutIcon}>🚪</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.dashboardCard}>
                    <Text style={styles.cardLabel}>Saldo em Caixa</Text>
                    {loading ? (
                        <ActivityIndicator color="#fff" style={{ marginVertical: 10 }} />
                    ) : (
                        <Text style={styles.balanceValue}>{formatarMoeda(saldo)}</Text>
                    )}
                    <View style={styles.divider} />
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Receitas</Text>
                            <Text style={[styles.statValue, { color: '#a5d6a7' }]}>
                                + {formatarMoeda(receitas)}
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Despesas</Text>
                            <Text style={[styles.statValue, { color: '#ef9a9a' }]}>
                                - {formatarMoeda(despesas)}
                            </Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Funcionalidades</Text>
                <View style={styles.menuGrid}>
                    <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Funcionalidade", "Abrir Novo Lançamento")}>
                        <View style={[styles.iconContainer, { backgroundColor: '#e8f5e9' }]}><Text style={styles.menuIcon}>📝</Text></View>
                        <Text style={styles.menuLabel}>Lançamento</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Funcionalidade", "Abrir Leitor de Notas (OCR)")}>
                        <View style={[styles.iconContainer, { backgroundColor: '#e3f2fd' }]}><Text style={styles.menuIcon}>📸</Text></View>
                        <Text style={styles.menuLabel}>Ler Nota OCR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('CategoriaScreen')}>
                        <View style={[styles.iconContainer, { backgroundColor: '#fff3e0' }]}><Text style={styles.menuIcon}>📁</Text></View>
                        <Text style={styles.menuLabel}>Cadastros</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Funcionalidade", "Dicas do Assistente IA")}>
                        <View style={[styles.iconContainer, { backgroundColor: '#f3e5f5' }]}><Text style={styles.menuIcon}>🤖</Text></View>
                        <Text style={styles.menuLabel}>Insights IA</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Funcionalidade", "Relatórios Financeiros")}>
                        <View style={[styles.iconContainer, { backgroundColor: '#e0f7fa' }]}><Text style={styles.menuIcon}>📊</Text></View>
                        <Text style={styles.menuLabel}>Relatórios</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Funcionalidade", "Definições do App")}>
                        <View style={[styles.iconContainer, { backgroundColor: '#f5f5f5' }]}><Text style={styles.menuIcon}>⚙️</Text></View>
                        <Text style={styles.menuLabel}>Ajustes</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 25 },
    greeting: { fontSize: 22, fontWeight: 'bold', color: '#1b5e20' },
    subGreeting: { fontSize: 14, color: '#666' },
    logoutButton: { padding: 10, backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
    logoutIcon: { fontSize: 20 },
    dashboardCard: { backgroundColor: '#2e7d32', marginHorizontal: 20, borderRadius: 20, padding: 20, elevation: 4 },
    cardLabel: { color: '#c8e6c9', fontSize: 14 },
    balanceValue: { color: '#fff', fontSize: 30, fontWeight: 'bold', marginVertical: 10 },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 15 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statItem: { flex: 1 },
    statLabel: { color: '#c8e6c9', fontSize: 12, marginBottom: 4 },
    statValue: { fontSize: 16, fontWeight: 'bold' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginHorizontal: 20, marginTop: 30, marginBottom: 15 },
    menuGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, justifyContent: 'space-between' },
    menuItem: { backgroundColor: '#fff', width: '46%', aspectRatio: 1, borderRadius: 20, padding: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 15, marginHorizontal: '2%', elevation: 2 },
    iconContainer: { width: 60, height: 60, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    menuIcon: { fontSize: 28 },
    menuLabel: { fontSize: 14, fontWeight: '600', color: '#444', textAlign: 'center' },
});