import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    Alert, 
    ActivityIndicator, 
    ScrollView, 
    StatusBar,
    KeyboardAvoidingView, 
    Platform              
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

export default function ReceitaScreen({ navigation, route }) {
    const lancamentoEdit = route.params?.lancamentoEdit || null;
    const isModoEdicao = !!lancamentoEdit;

    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const [data, setData] = useState(new Date()); 
    const [showPicker, setShowPicker] = useState(false);
    const tipo = 'RECEITA';
    const [categoriaId, setCategoriaId] = useState(null);

    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(false);

    const API_URL_LANCAMENTOS = `${process.env.EXPO_PUBLIC_API_URL}/lancamentos`;
    const API_URL_CATEGORIAS = `${process.env.EXPO_PUBLIC_API_URL}/categorias`;

    useEffect(() => {
        carregarCategorias();
        if (isModoEdicao) {
            setDescricao(lancamentoEdit.descricao);
            setCategoriaId(lancamentoEdit.categoria?.id);

            // Formata o valor do banco para a máscara de moeda
            if (lancamentoEdit.valor) {
                const valorStringParaMascara = lancamentoEdit.valor.toFixed(2).toString();
                formatarMoeda(valorStringParaMascara);
            }

            if (lancamentoEdit.data) {
                const [ano, mes, dia] = lancamentoEdit.data.split('-');
                setData(new Date(ano, mes - 1, dia));
            }
        }
    }, []);

    const carregarCategorias = async () => {
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
            const response = await axios.get(`${API_URL_CATEGORIAS}?tipo=RECEITA`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCategorias(response.data);
        } catch (error) {
            console.error("Erro ao buscar categorias:", error);
            Alert.alert("Erro", "Não foi possível carregar as categorias.");
        }
    };

    // --- FUNÇÕES DE DATA E MOEDA ---
    const onChangeDate = (event, selectedDate) => {
        const currentDate = selectedDate || data;
        setShowPicker(Platform.OS === 'ios');
        setData(currentDate);
    };

    const formatarDataVisual = (dataObj) => {
        const dia = String(dataObj.getDate()).padStart(2, '0');
        const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
        const ano = dataObj.getFullYear();
        return `${dia}/${mes}/${ano}`;
    };

    const formatarDataAPI = (dataObj) => {
        const dia = String(dataObj.getDate()).padStart(2, '0');
        const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
        const ano = dataObj.getFullYear();
        return `${ano}-${mes}-${dia}`;
    };

    const formatarMoeda = (texto) => {
        let valorLimpo = String(texto).replace(/\D/g, '');

        if (valorLimpo === '') {
            setValor('');
            return;
        }

        const valorNumerico = (parseInt(valorLimpo, 10) / 100).toFixed(2);
        const valorFormatado = valorNumerico
            .replace('.', ',')
            .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');

        setValor(valorFormatado);
    };

    // --- EXCLUSÃO DE RECEITA ---
    const deletarLancamento = () => {
        Alert.alert(
            "Excluir Receita?",
            "Esta ação não pode ser desfeita.",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Excluir", 
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
                            await axios.delete(`${API_URL_LANCAMENTOS}/${lancamentoEdit.id}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            Alert.alert("Sucesso", "Receita excluída!");
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert("Erro", "Não foi possível excluir a receita.");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const salvarLancamento = async () => {
        if (!descricao || !valor || !categoriaId) {
            Alert.alert("Aviso", "Preencha a descrição, valor e escolha uma categoria.");
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
            
            // Remove a máscara (pontos e vírgula) para enviar o float correto
            const valorTratadoParaAPI = parseFloat(valor.replace(/\./g, '').replace(',', '.'));

            // --- AQUI ESTÁ O AJUSTE "POR DEBAIXO DOS PANOS" ---
            const payload = {
                descricao: descricao,
                valor: valorTratadoParaAPI,
                tipo: tipo,
                status: 'PAGO', // Força o backend a aceitar como pago e contabilizar no saldo
                data: formatarDataAPI(data), 
                categoria: { id: categoriaId }
            };

            let response;

            if (isModoEdicao) {
                // Atualizar
                response = await axios.put(`${API_URL_LANCAMENTOS}/${lancamentoEdit.id}`, payload, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } else {
                // Criar
                response = await axios.post(API_URL_LANCAMENTOS, payload, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }

            if (response.status === 201 || response.status === 200) {
                Alert.alert("Sucesso", isModoEdicao ? "Receita atualizada com sucesso!" : "Receita registada com sucesso!");
                navigation.goBack();
            }
        } catch (error) {
            console.error("Erro ao salvar lançamento:", error);
            Alert.alert("Erro", "Não foi possível salvar a receita.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#2e7d32" />
                </TouchableOpacity>
                
                <Text style={styles.headerTitle}>{isModoEdicao ? 'Editar Receita' : 'Nova Receita'}</Text>
                
                {/* LIXEIRA (Só exibe se estiver editando) */}
                {isModoEdicao ? (
                    <TouchableOpacity onPress={deletarLancamento} style={styles.deleteButton}>
                        <Ionicons name="trash-outline" size={24} color="#d32f2f" />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 40 }} /> 
                )}
            </View>

            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 20}
            >
                <ScrollView 
                    showsVerticalScrollIndicator={false} 
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    
                    <Text style={styles.sectionLabel}>Detalhes da Entrada</Text>
                    
                    <View style={styles.inputContainer}>
                        <Ionicons name="document-text-outline" size={20} color="#2e7d32" style={styles.inputIcon} />
                        <TextInput
                            style={styles.inputText}
                            placeholder="Descrição (ex: Venda de Produto)"
                            placeholderTextColor="#888"
                            value={descricao}
                            onChangeText={setDescricao}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.currencySymbol}>R$</Text>
                        <TextInput
                            style={[styles.inputText, { fontSize: 18, fontWeight: 'bold' }]}
                            placeholder="0,00"
                            placeholderTextColor="#888"
                            keyboardType="numeric"
                            value={valor}
                            onChangeText={formatarMoeda}
                        />
                    </View>

                    <Text style={styles.sectionLabel}>Data de Recebimento</Text>
                    <TouchableOpacity style={styles.inputContainer} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
                        <Ionicons name="calendar-outline" size={20} color="#2e7d32" style={styles.inputIcon} />
                        <View style={{ flex: 1, justifyContent: 'center', height: '100%' }}>
                            <Text style={styles.dateText}>{formatarDataVisual(data)}</Text>
                        </View>
                        <Ionicons name="chevron-down" size={20} color="#888" />
                    </TouchableOpacity>

                    {showPicker && (
                        <DateTimePicker
                            value={data}
                            mode="date"
                            display="default"
                            onChange={onChangeDate}
                        />
                    )}

                    <Text style={styles.sectionLabel}>Categoria</Text>
                    <View style={styles.categoriasGrid}>
                        {categorias.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[styles.catButton, categoriaId === cat.id && styles.catButtonAtivo]}
                                onPress={() => setCategoriaId(cat.id)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.catText, categoriaId === cat.id && styles.catTextAtivo]}>
                                    {cat.nome}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity style={styles.saveButton} onPress={salvarLancamento} disabled={loading} activeOpacity={0.8}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name={isModoEdicao ? "save-outline" : "checkmark-circle-outline"} size={22} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.saveButtonText}>{isModoEdicao ? "ATUALIZAR RECEITA" : "SALVAR RECEITA"}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
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
        paddingBottom: 15,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e8f5e9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ffebee',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    
    scrollContent: { paddingHorizontal: 20, paddingBottom: 150, paddingTop: 10 },
    
    sectionLabel: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 10, marginTop: 15 },
    
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 15,
        paddingHorizontal: 15,
        height: 55,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    inputIcon: { marginRight: 10 },
    currencySymbol: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32', marginRight: 10 },
    inputText: { flex: 1, height: '100%', color: '#333', fontSize: 16 },
    dateText: { fontSize: 16, color: '#333' },
    
    categoriasGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20, gap: 8 },
    catButton: { 
        backgroundColor: '#fff', 
        paddingVertical: 10, 
        paddingHorizontal: 16, 
        borderRadius: 20, 
        borderWidth: 1,
        borderColor: '#ddd',
    },
    catButtonAtivo: { backgroundColor: '#2e7d32', borderColor: '#2e7d32' },
    catText: { color: '#555', fontSize: 14, fontWeight: '500' },
    catTextAtivo: { color: '#fff', fontWeight: 'bold' },
    
    saveButton: { 
        flexDirection: 'row',
        backgroundColor: '#2e7d32', 
        height: 55, 
        borderRadius: 12, 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginTop: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});