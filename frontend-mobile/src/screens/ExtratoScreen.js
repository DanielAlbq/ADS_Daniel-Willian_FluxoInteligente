import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ExtratoScreen({ navigation }) {
    const [lancamentos, setLancamentos] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filtros de Data
    const [dataInicio, setDataInicio] = useState(new Date(new Date().setDate(1))); // Primeiro dia do mês
    const [dataFim, setDataFim] = useState(new Date()); // Hoje
    const [showPickerInicio, setShowPickerInicio] = useState(false);
    const [showPickerFim, setShowPickerFim] = useState(false);

    const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/lancamentos/extrato`;

    useEffect(() => {
        carregarExtrato();
    }, [dataInicio, dataFim]); // Recarrega sempre que as datas mudarem

    const carregarExtrato = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
            // Formatar para YYYY-MM-DD pro backend
            const inicioFormatado = dataInicio.toISOString().split('T')[0];
            const fimFormatado = dataFim.toISOString().split('T')[0];

            const response = await axios.get(`${API_URL}?dataInicio=${inicioFormatado}&dataFim=${fimFormatado}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setLancamentos(response.data);
        } catch (error) {
            console.error("Erro ao buscar extrato", error);
        } finally {
            setLoading(false);
        }
    };

    const calcularSaldoFiltrado = () => {
        return lancamentos.reduce((acc, atual) => {
            return atual.tipo === 'RECEITA' ? acc + atual.valor : acc - atual.valor;
        }, 0);
    };

    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    };

    const renderItem = ({ item }) => (
        <View style={styles.lancamentoCard}>
            <View style={styles.lancamentoInfo}>
                <Text style={styles.descricao}>{item.descricao}</Text>
                <Text style={styles.data}>{item.data.split('-').reverse().join('/')}</Text>
            </View>
            <Text style={[styles.valor, { color: item.tipo === 'RECEITA' ? '#2e7d32' : '#c62828' }]}>
                {item.tipo === 'RECEITA' ? '+ ' : '- '}{formatarMoeda(item.valor)}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.titulo}>Extrato Financeiro</Text>

            {/* Seção de Filtros */}
            <View style={styles.filtroContainer}>
                <TouchableOpacity onPress={() => setShowPickerInicio(true)} style={styles.dateBtn}>
                    <Text style={styles.dateText}>De: {dataInicio.toLocaleDateString('pt-BR')}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setShowPickerFim(true)} style={styles.dateBtn}>
                    <Text style={styles.dateText}>Até: {dataFim.toLocaleDateString('pt-BR')}</Text>
                </TouchableOpacity>
            </View>

            {showPickerInicio && (
                <DateTimePicker
                    value={dataInicio} mode="date"
                    onChange={(event, date) => {
                        setShowPickerInicio(false);
                        if (date) setDataInicio(date);
                    }}
                />
            )}

            {showPickerFim && (
                <DateTimePicker
                    value={dataFim} mode="date"
                    onChange={(event, date) => {
                        setShowPickerFim(false);
                        if (date) setDataFim(date);
                    }}
                />
            )}

            {/* NOVA SEÇÃO: Saldo no Topo */}
            <View style={styles.saldoContainer}>
                <Text style={styles.saldoLabel}>Saldo do Período</Text>
                <Text style={[styles.saldoValor, { color: calcularSaldoFiltrado() >= 0 ? '#2e7d32' : '#c62828' }]}>
                    {formatarMoeda(calcularSaldoFiltrado())}
                </Text>
            </View>

            {/* Lista de Transações */}
            {loading ? (
                <ActivityIndicator size="large" color="#2e7d32" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={lancamentos}
                    keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={<Text style={styles.emptyText}>Nenhum lançamento no período.</Text>}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 20
    },
    titulo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1b5e20',
        marginBottom: 20
    },
    filtroContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20
    },
    dateBtn: {
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 10,
        width: '48%',
        alignItems: 'center',
        elevation: 2
    },
    dateText: {
        color: '#333',
        fontWeight: '500'
    },
    saldoContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    saldoLabel: {
        fontSize: 14,
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 5
    },
    saldoValor: {
        fontSize: 32,
        fontWeight: 'bold'
    },
    lancamentoCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        elevation: 1
    },
    lancamentoInfo: {
        flex: 1
    },
    descricao: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
    },
    data: {
        fontSize: 12,
        color: '#888',
        marginTop: 4
    },
    valor: {
        fontSize: 16,
        fontWeight: 'bold'
    },
    emptyText: {
        textAlign: 'center',
        color: '#888',
        marginTop: 30
    }
});