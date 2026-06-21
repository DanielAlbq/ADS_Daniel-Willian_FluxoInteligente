import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

const MESES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function ExtratoScreen({ route, navigation }) {
    const [mesAtual, setMesAtual] = useState(route.params?.mesFiltro || new Date().getMonth() + 1);
    const [anoAtual, setAnoAtual] = useState(route.params?.anoFiltro || new Date().getFullYear());
    const [tipoFiltro, setTipoFiltro] = useState(route.params?.tipoFiltro || 'TODOS'); 

    const [lancamentos, setLancamentos] = useState([]);
    const [loading, setLoading] = useState(true);

    const [totalReceitas, setTotalReceitas] = useState(0);
    const [totalDespesas, setTotalDespesas] = useState(0);

    const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/lancamentos`;

    useFocusEffect(
        useCallback(() => {
            carregarExtrato();
        }, [mesAtual, anoAtual, tipoFiltro])
    );

    const carregarExtrato = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
            if (!token) {
                navigation.replace('Login');
                return;
            }

            const start = new Date(anoAtual, mesAtual - 1, 1);
            const end = new Date(anoAtual, mesAtual, 0);
            
            const formatarDataAPI = (data) => {
                const year = data.getFullYear();
                const month = String(data.getMonth() + 1).padStart(2, '0');
                const day = String(data.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            let url = `${API_URL}/filtrar?dataInicio=${formatarDataAPI(start)}&dataFim=${formatarDataAPI(end)}`;
            
            if (tipoFiltro !== 'TODOS') {
                url += `&tipo=${tipoFiltro}`;
            }

            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const dados = response.data;
            setLancamentos(dados);

            let rec = 0;
            let desp = 0;
            dados.forEach(item => {
                // Aqui podemos até somar só os pagos se quisermos, mas como é extrato, geralmente mostra tudo
                if (item.tipo === 'RECEITA') rec += item.valor;
                if (item.tipo === 'DESPESA') desp += item.valor;
            });
            setTotalReceitas(rec);
            setTotalDespesas(desp);

        } catch (error) {
            console.error("Erro ao buscar extrato:", error);
            Alert.alert("Erro", "Não foi possível carregar o extrato.");
        } finally {
            setLoading(false);
        }
    };

    // --- NOVA FUNÇÃO: DAR BAIXA NUM LANÇAMENTO ---
    const darBaixaLancamento = async (idLancamento) => {
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
            const response = await fetch(`${API_URL}/${idLancamento}/pagar`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                Alert.alert('Sucesso', 'Conta marcada como paga!');
                carregarExtrato(); // Recarrega a lista para atualizar a cor e remover o botão
            } else {
                Alert.alert('Erro', 'Não foi possível atualizar o status da conta.');
            }
        } catch (error) {
            console.error("Erro ao dar baixa", error);
            Alert.alert('Erro', 'Ocorreu um erro ao conectar com o servidor.');
        }
    };

    const mesAnterior = () => {
        if (mesAtual === 1) {
            setMesAtual(12);
            setAnoAtual(anoAtual - 1);
        } else {
            setMesAtual(mesAtual - 1);
        }
    };

    const mesProximo = () => {
        if (mesAtual === 12) {
            setMesAtual(1);
            setAnoAtual(anoAtual + 1);
        } else {
            setMesAtual(mesAtual + 1);
        }
    };

    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    };

    const formatarDataExibicao = (dataISO) => {
        if (!dataISO) return '';
        const [ano, mes, dia] = dataISO.split('-');
        return `${dia}/${mes}/${ano}`;
    };

    const exportarExcel = async () => {
        if (lancamentos.length === 0) {
            Alert.alert("Aviso", "Não há lançamentos para exportar neste período.");
            return;
        }
        try {
            let csvString = "Data;Descricao;Tipo;Status;Fornecedor;Valor\n";
            lancamentos.forEach((l) => {
                const dataFormatada = formatarDataExibicao(l.dataPagamento || l.data);
                const valorFormatado = new Intl.NumberFormat("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }).format(l.valor);
                const nomeFornecedor = l.fornecedor ? l.fornecedor.nome : "";
                
                csvString += `${dataFormatada};${l.descricao};${l.tipo};${l.status};${nomeFornecedor};${valorFormatado}\n`;
            });

            const hoje = new Date();
            const dataEmissao = `${String(hoje.getDate()).padStart(2, '0')}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${hoje.getFullYear()}`;
            
            const nomeArquivo = `extrato_fluxo_inteligente_${dataEmissao}.csv`;
            const fileUri = FileSystem.documentDirectory + nomeArquivo;

            await FileSystem.writeAsStringAsync(fileUri, csvString);
            await Sharing.shareAsync(fileUri, {
                dialogTitle: "Exportar Extrato Excel",
                mimeType: "text/csv",
                UTI: "public.comma-separated-values-text"
            });
        } catch (error) {
            Alert.alert("Erro", "Não foi possível gerar o arquivo Excel.");
        }
    };

    const exportarPDF = async () => {
        if (lancamentos.length === 0) {
            Alert.alert("Aviso", "Não há lançamentos para exportar neste período.");
            return;
        }
        try {
            let htmlRows = "";
            lancamentos.forEach((l) => {
                const dataFormatada = formatarDataExibicao(l.dataPagamento || l.data);
                const corValor = l.tipo === "RECEITA" ? "green" : "red";
                const sinal = l.tipo === "RECEITA" ? "+" : "-";
                const nomeFornecedor = l.fornecedor ? `<br><small style="color: #666;">Fornecedor: ${l.fornecedor.nome}</small>` : "";

                htmlRows += `
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${dataFormatada}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${l.descricao} ${nomeFornecedor}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd; color: ${corValor}; text-align: right;">
                            ${sinal} ${formatarMoeda(l.valor)}
                        </td>
                    </tr>
                `;
            });

            const htmlContent = `
                <html>
                    <body style="font-family: Helvetica, Arial, sans-serif; padding: 20px;">
                        <h1 style="color: #1b5e20; text-align: center;">Fluxo Inteligente</h1>
                        <h2 style="text-align: center;">Extrato Financeiro</h2>
                        <p style="text-align: center; color: #666;">Período: ${MESES[mesAtual - 1]} de ${anoAtual}</p>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                            <thead>
                                <tr style="background-color: #2e7d32; color: white;">
                                    <th style="padding: 10px; text-align: left;">Data</th>
                                    <th style="padding: 10px; text-align: left;">Descrição</th>
                                    <th style="padding: 10px; text-align: right;">Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${htmlRows}
                            </tbody>
                        </table>
                        <h3 style="text-align: right; margin-top: 20px;">
                            Total Entradas: ${formatarMoeda(totalReceitas)} <br>
                            Total Saídas: ${formatarMoeda(totalDespesas)} <br>
                            Saldo do Período: ${formatarMoeda(totalReceitas - totalDespesas)}
                        </h3>
                    </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            const hoje = new Date();
            const dataEmissao = `${String(hoje.getDate()).padStart(2, '0')}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${hoje.getFullYear()}`;
            
            const nomeArquivoPDF = `extrato_fluxo_inteligente_${dataEmissao}.pdf`;
            const novoFileUri = FileSystem.documentDirectory + nomeArquivoPDF;

            await FileSystem.moveAsync({ from: uri, to: novoFileUri });
            await Sharing.shareAsync(novoFileUri, { dialogTitle: "Exportar Extrato PDF" });
            
        } catch (error) {
            Alert.alert("Erro", "Não foi possível gerar o PDF.");
        }
    };

    // --- ITEM DO EXTRATO ATUALIZADO COM FORNECEDOR E STATUS ---
    const renderItem = ({ item }) => {
        const isReceita = item.tipo === 'RECEITA';

        const handleEdit = () => {
            if (isReceita) {
                navigation.navigate('ReceitaScreen', { lancamentoEdit: item });
            } else {
                navigation.navigate('DespesaScreen', { lancamentoEdit: item });
            }
        };

        return (
            <TouchableOpacity 
                style={styles.cardLancamento} 
                onPress={handleEdit} 
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, { backgroundColor: isReceita ? '#e8f5e9' : '#ffebee' }]}>
                    <Ionicons 
                        name={isReceita ? "arrow-up-outline" : "arrow-down-outline"} 
                        size={20} 
                        color={isReceita ? "#2e7d32" : "#d32f2f"} 
                    />
                </View>
                
                <View style={styles.infoContainer}>
                    <Text style={styles.descricaoText} numberOfLines={1}>{item.descricao}</Text>
                    
                    <Text style={styles.categoriaText}>
                        {item.categoria?.nome || 'Sem Categoria'} • {formatarDataExibicao(item.dataPagamento || item.data)}
                    </Text>

                    {/* --- EXIBE O FORNECEDOR SE EXISTIR --- */}
                    {item.fornecedor && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Ionicons name="business-outline" size={13} color="#666" style={{ marginRight: 4 }} />
                            <Text style={{ fontSize: 12, color: '#666' }}>
                                {item.fornecedor.nome}
                            </Text>
                        </View>
                    )}

                    {/* --- EXIBE O STATUS (PAGO/PENDENTE) --- */}
                    <Text style={{ 
                        fontSize: 11, 
                        fontWeight: 'bold', 
                        marginTop: 4,
                        color: item.status === 'PAGO' ? '#2e7d32' : '#f57c00' 
                    }}>
                        {item.status === 'PAGO' ? 'PAGO' : 'PENDENTE'}
                    </Text>
                </View>
                
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.valorText, { color: isReceita ? '#2e7d32' : '#d32f2f' }]}>
                        {isReceita ? '+' : '-'} {formatarMoeda(item.valor)}
                    </Text>

                    {/* --- BOTÃO "PAGAR" APARECE APENAS SE ESTIVER PENDENTE --- */}
                    {item.status === 'PENDENTE' && (
                        <TouchableOpacity 
                            style={styles.btnPagarPequeno} 
                            onPress={() => darBaixaLancamento(item.id)}
                        >
                            <Text style={styles.btnPagarTexto}>Dar Baixa</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Extrato</Text>
                </View>
                
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity onPress={exportarPDF} style={styles.exportBtn}>
                        <Ionicons name="document-text" size={16} color="#d32f2f" />
                        <Text style={styles.exportBtnText}>PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={exportarExcel} style={styles.exportBtn}>
                        <Ionicons name="grid" size={16} color="#2e7d32" />
                        <Text style={styles.exportBtnText}>Excel</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.filtrosRow}>
                <TouchableOpacity 
                    style={[styles.chipFiltro, tipoFiltro === 'TODOS' && styles.chipFiltroAtivo]} 
                    onPress={() => setTipoFiltro('TODOS')}
                >
                    <Text style={[styles.textoFiltro, tipoFiltro === 'TODOS' && styles.textoFiltroAtivo]}>Tudo</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.chipFiltro, tipoFiltro === 'RECEITA' && styles.chipFiltroReceita]} 
                    onPress={() => setTipoFiltro('RECEITA')}
                >
                    <Text style={[styles.textoFiltro, tipoFiltro === 'RECEITA' && styles.textoFiltroAtivo]}>Receitas</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.chipFiltro, tipoFiltro === 'DESPESA' && styles.chipFiltroDespesa]} 
                    onPress={() => setTipoFiltro('DESPESA')}
                >
                    <Text style={[styles.textoFiltro, tipoFiltro === 'DESPESA' && styles.textoFiltroAtivo]}>Despesas</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.mesSelector}>
                <TouchableOpacity onPress={mesAnterior} style={styles.setaMes}>
                    <Ionicons name="chevron-back" size={24} color="#555" />
                </TouchableOpacity>
                <Text style={styles.mesTexto}>{MESES[mesAtual - 1]} {anoAtual}</Text>
                <TouchableOpacity onPress={mesProximo} style={styles.setaMes}>
                    <Ionicons name="chevron-forward" size={24} color="#555" />
                </TouchableOpacity>
            </View>

            <View style={styles.resumoContainer}>
                <View style={styles.resumoItem}>
                    <Text style={styles.resumoLabel}>Entradas</Text>
                    <Text style={[styles.resumoValor, { color: '#2e7d32' }]}>{formatarMoeda(totalReceitas)}</Text>
                </View>
                <View style={styles.linhaVertical} />
                <View style={styles.resumoItem}>
                    <Text style={styles.resumoLabel}>Saídas</Text>
                    <Text style={[styles.resumoValor, { color: '#d32f2f' }]}>{formatarMoeda(totalDespesas)}</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#2e7d32" />
                    <Text style={{ marginTop: 10, color: '#666' }}>Buscando transações...</Text>
                </View>
            ) : (
                <FlatList
                    data={lancamentos}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={60} color="#ddd" />
                            <Text style={styles.emptyText}>Nenhuma transação encontrada</Text>
                            <Text style={styles.emptySubText}>Tente alterar o mês ou os filtros acima.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e0e0e0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginLeft: 15 },
    
    exportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginLeft: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        borderWidth: 1,
        borderColor: '#eee'
    },
    exportBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#555',
        marginLeft: 6
    },
    
    filtrosRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 15,
        justifyContent: 'space-between',
    },
    chipFiltro: {
        flex: 1,
        backgroundColor: '#fff',
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 20,
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    chipFiltroAtivo: { backgroundColor: '#546e7a', borderColor: '#546e7a' },
    chipFiltroReceita: { backgroundColor: '#2e7d32', borderColor: '#2e7d32' },
    chipFiltroDespesa: { backgroundColor: '#d32f2f', borderColor: '#d32f2f' },
    textoFiltro: { color: '#666', fontWeight: '600', fontSize: 13 },
    textoFiltroAtivo: { color: '#fff', fontWeight: 'bold' },

    mesSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 30,
        marginBottom: 15,
    },
    mesTexto: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    setaMes: { padding: 5 },

    resumoContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        borderRadius: 16,
        paddingVertical: 15,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    resumoItem: { flex: 1, alignItems: 'center' },
    resumoLabel: { fontSize: 13, color: '#666', marginBottom: 4 },
    resumoValor: { fontSize: 16, fontWeight: 'bold' },
    linhaVertical: { width: 1, backgroundColor: '#eee' },

    listContainer: { paddingHorizontal: 20, paddingBottom: 40 },
    cardLancamento: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    infoContainer: { flex: 1, paddingRight: 10 },
    descricaoText: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 2 },
    categoriaText: { fontSize: 12, color: '#888' },
    valorText: { fontSize: 15, fontWeight: 'bold' },

    // Estilos do Botão Dar Baixa
    btnPagarPequeno: {
        backgroundColor: '#f57c00', // Laranja para chamar a atenção
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginTop: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
    },
    btnPagarTexto: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },

    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 50 },
    emptyText: { fontSize: 16, fontWeight: 'bold', color: '#555', marginTop: 15 },
    emptySubText: { fontSize: 14, color: '#888', marginTop: 5, textAlign: 'center' }
});