import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function HomeScreen({ navigation }) {

    // Função para simular o logout
    const handleLogout = () => {
        Alert.alert("Sair", "Deseja realmente sair da aplicação?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Sair", onPress: () => navigation.replace('Login') }
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#2e7d32" />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* CABEÇALHO */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Olá, Empreendedor!</Text>
                        <Text style={styles.subGreeting}>Bem-vindo ao Fluxo Inteligente</Text>
                    </View>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutIcon}>🚪</Text>
                    </TouchableOpacity>
                </View>

                {/* CARD DE RESUMO (HU04.1 - Dashboard) */}
                <View style={styles.dashboardCard}>
                    <Text style={styles.cardLabel}>Saldo em Caixa</Text>
                    <Text style={styles.balanceValue}>R$ 5.430,00</Text>

                    <View style={styles.divider} />

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Receitas</Text>
                            <Text style={[styles.statValue, { color: '#a5d6a7' }]}>+ R$ 8.200</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Despesas</Text>
                            <Text style={[styles.statValue, { color: '#ef9a9a' }]}>- R$ 2.770</Text>
                        </View>
                    </View>
                </View>

                {/* MENU DE FUNCIONALIDADES */}
                <Text style={styles.sectionTitle}>Funcionalidades</Text>

                <View style={styles.menuGrid}>
                    {/* LANÇAMENTO MANUAL (UC02) */}
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => Alert.alert("Funcionalidade", "Abrir Novo Lançamento")}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: '#e8f5e9' }]}>
                            <Text style={styles.menuIcon}>📝</Text>
                        </View>
                        <Text style={styles.menuLabel}>Lançamento</Text>
                    </TouchableOpacity>

                    {/* LEITURA OCR (UC09 / UC06) */}
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => Alert.alert("Funcionalidade", "Abrir Leitor de Notas (OCR)")}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: '#e3f2fd' }]}>
                            <Text style={styles.menuIcon}>📸</Text>
                        </View>
                        <Text style={styles.menuLabel}>Ler Nota OCR</Text>
                    </TouchableOpacity>

                    {/* CADASTROS (UC03, UC07, UC08) */}
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('CategoriaScreen')}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: '#fff3e0' }]}>
                            <Text style={styles.menuIcon}>📁</Text>
                        </View>
                        <Text style={styles.menuLabel}>Cadastros</Text>
                    </TouchableOpacity>

                    {/* INSIGHTS IA (UC05 / UC10) */}
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => Alert.alert("Funcionalidade", "Dicas do Assistente IA")}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: '#f3e5f5' }]}>
                            <Text style={styles.menuIcon}>🤖</Text>
                        </View>
                        <Text style={styles.menuLabel}>Insights IA</Text>
                    </TouchableOpacity>

                    {/* RELATÓRIOS (UC04) */}
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => Alert.alert("Funcionalidade", "Relatórios Financeiros")}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: '#e0f7fa' }]}>
                            <Text style={styles.menuIcon}>📊</Text>
                        </View>
                        <Text style={styles.menuLabel}>Relatórios</Text>
                    </TouchableOpacity>

                    {/* CONFIGURAÇÕES */}
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => Alert.alert("Funcionalidade", "Definições do App")}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: '#f5f5f5' }]}>
                            <Text style={styles.menuIcon}>⚙️</Text>
                        </View>
                        <Text style={styles.menuLabel}>Ajustes</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 25,
    },
    greeting: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1b5e20',
    },
    subGreeting: {
        fontSize: 14,
        color: '#666',
    },
    logoutButton: {
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
    },
    logoutIcon: {
        fontSize: 20,
    },
    dashboardCard: {
        backgroundColor: '#2e7d32',
        marginHorizontal: 20,
        borderRadius: 20,
        padding: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
    },
    cardLabel: {
        color: '#c8e6c9',
        fontSize: 14,
    },
    balanceValue: {
        color: '#fff',
        fontSize: 30,
        fontWeight: 'bold',
        marginVertical: 10,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginVertical: 15,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        flex: 1,
    },
    statLabel: {
        color: '#c8e6c9',
        fontSize: 12,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginHorizontal: 20,
        marginTop: 30,
        marginBottom: 15,
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 15,
        justifyContent: 'space-between',
    },
    menuItem: {
        backgroundColor: '#fff',
        width: '46%', // Aproximadamente metade da largura com margens
        aspectRatio: 1, // Faz o botão ser quadrado
        borderRadius: 20,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        marginHorizontal: '2%',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    menuIcon: {
        fontSize: 28,
    },
    menuLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#444',
        textAlign: 'center',
    },
});