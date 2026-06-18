import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function LancamentoScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
            
            {/* CABEÇALHO PERSONALIZADO */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#2e7d32" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Novo Lançamento</Text>
                {/* Espaçador invisível para manter o título centralizado */}
                <View style={{ width: 40 }} /> 
            </View>

            <View style={styles.content}>
                <Text style={styles.subtitle}>O que pretende registar agora?</Text>

                {/* CARTÃO DE RECEITA */}
                <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('ReceitaScreen')}>
                    <LinearGradient
                        colors={['#2e7d32', '#4caf50']} // Gradiente Verde
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.card}
                    >
                        <View style={styles.iconWrapper}>
                            <Ionicons name="trending-up" size={36} color="#fff" />
                        </View>
                        <View style={styles.textWrapper}>
                            <Text style={styles.cardTitle}>Nova Receita</Text>
                            <Text style={styles.cardDescription}>Entrada de dinheiro, vendas, pagamentos de clientes.</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.6)" />
                    </LinearGradient>
                </TouchableOpacity>

                {/* CARTÃO DE DESPESA */}
                <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('DespesaScreen')}>
                    <LinearGradient
                        colors={['#c62828', '#ef5350']} // Gradiente Vermelho
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.card}
                    >
                        <View style={styles.iconWrapper}>
                            <Ionicons name="trending-down" size={36} color="#fff" />
                        </View>
                        <View style={styles.textWrapper}>
                            <Text style={styles.cardTitle}>Nova Despesa</Text>
                            <Text style={styles.cardDescription}>Pagamentos de contas, compras, impostos e taxas.</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.6)" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f8f9fa' 
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e8f5e9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    subtitle: {
        fontSize: 16,
        color: '#555',
        marginBottom: 30,
        textAlign: 'center',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    iconWrapper: {
        width: 60,
        height: 60,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.2)', // Fundo translúcido para destacar o ícone
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    textWrapper: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
        lineHeight: 18,
    }
});