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
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

export default function DespesaScreen({ navigation }) {
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const tipo = 'DESPESA';
    const [categoriaId, setCategoriaId] = useState(null);
    const [fornecedorId, setFornecedorId] = useState(null);

    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(false);

    const [cnpjBusca, setCnpjBusca] = useState('');
    const [nomeFornecedorLocalizado, setNomeFornecedorLocalizado] = useState('');
    const [buscandoFornecedor, setBuscandoFornecedor] = useState(false);

    const API_URL_LANCAMENTOS = `${process.env.EXPO_PUBLIC_API_URL}/lancamentos`;
    const API_URL_CATEGORIAS = `${process.env.EXPO_PUBLIC_API_URL}/categorias`;
    const API_URL_FORNECEDORES = `${process.env.EXPO_PUBLIC_API_URL}/fornecedores`;

    useEffect(() => {
        carregarCategorias();
    }, []);

    const carregarCategorias = async () => {
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
            const response = await axios.get(`${API_URL_CATEGORIAS}?tipo=DESPESA`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCategorias(response.data);
        } catch (error) {
            console.error("Erro ao buscar categorias:", error);
            Alert.alert("Erro", "Não foi possível carregar as categorias.");
        }
    };

    const buscarFornecedorPorCnpj = async () => {
        if (!cnpjBusca) {
            Alert.alert("Aviso", "Digite um CNPJ para procurar.");
            return;
        }

        setBuscandoFornecedor(true);
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
            const response = await axios.get(`${API_URL_FORNECEDORES}/cnpj/${cnpjBusca}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setFornecedorId(response.data.id);
            setNomeFornecedorLocalizado(response.data.nome);

        } catch (error) {
            if (error.response && error.response.status === 404) {
                setFornecedorId(null);
                setNomeFornecedorLocalizado('');

                Alert.alert(
                    "Fornecedor não encontrado",
                    "Esse CNPJ não está cadastrado. Deseja cadastrar agora?",
                    [
                        { text: "Não", style: "cancel" },
                        { text: "Sim", onPress: () => navigation.navigate('FornecedorScreen', { cnpjPreenchido: cnpjBusca }) }
                    ]
                );
            } else {
                Alert.alert("Erro", "Falha ao procurar fornecedor. Tente novamente.");
            }
        } finally {
            setBuscandoFornecedor(false);
        }
    };

    const salvarLancamento = async () => {
        if (!descricao || !valor || !categoriaId) {
            Alert.alert("Aviso", "Preencha a descrição, valor e escolha uma categoria.");
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
            const payload = {
                descricao: descricao,
                valor: parseFloat(valor.replace(',', '.')),
                tipo: tipo,
                data: new Date().toISOString().split('T')[0],
                categoria: { id: categoriaId },
                fornecedor: fornecedorId ? { id: fornecedorId } : null
            };

            const response = await axios.post(API_URL_LANCAMENTOS, payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 201 || response.status === 200) {
                Alert.alert("Sucesso", "Despesa registada com sucesso!");
                navigation.goBack();
            }
        } catch (error) {
            console.error("Erro ao salvar lançamento:", error);
            Alert.alert("Erro", "Não foi possível salvar a despesa.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
            
            {/* CABEÇALHO (Fora do KeyboardAvoidingView) */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#d32f2f" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Nova Despesa</Text>
                <View style={{ width: 40 }} /> 
            </View>

            {/* PROTEÇÃO AVANÇADA DO TECLADO */}
            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 20} // Compensa a altura do cabeçalho
            >
                <ScrollView 
                    showsVerticalScrollIndicator={false} 
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled" // Permite clicar em botões mesmo com o teclado aberto
                >
                    
                    <Text style={styles.sectionLabel}>Detalhes da Saída</Text>
                    
                    <View style={styles.inputContainer}>
                        <Ionicons name="document-text-outline" size={20} color="#d32f2f" style={styles.inputIcon} />
                        <TextInput
                            style={styles.inputText}
                            placeholder="Descrição (ex: Material de Escritório)"
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
                            onChangeText={setValor}
                        />
                    </View>

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

                    <Text style={styles.sectionLabel}>Fornecedor (Opcional)</Text>
                    <View style={[styles.inputContainer, { paddingHorizontal: 0, overflow: 'hidden' }]}>
                        <View style={{ paddingLeft: 15 }}>
                            <Ionicons name="business-outline" size={20} color="#666" style={styles.inputIcon} />
                        </View>
                        <TextInput
                            style={[styles.inputText, { paddingHorizontal: 10 }]}
                            placeholder="Introduza o CNPJ"
                            placeholderTextColor="#888"
                            keyboardType="numeric"
                            value={cnpjBusca}
                            onChangeText={setCnpjBusca}
                        />
                        <TouchableOpacity style={styles.searchButton} onPress={buscarFornecedorPorCnpj} disabled={buscandoFornecedor}>
                            {buscandoFornecedor ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Ionicons name="search" size={20} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>

                    {nomeFornecedorLocalizado ? (
                        <View style={styles.successBadge}>
                            <Ionicons name="checkmark-circle" size={18} color="#2e7d32" />
                            <Text style={styles.successText}>Vinculado: {nomeFornecedorLocalizado}</Text>
                        </View>
                    ) : null}

                    <TouchableOpacity style={styles.saveButton} onPress={salvarLancamento} disabled={loading} activeOpacity={0.8}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="close-circle-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.saveButtonText}>SALVAR DESPESA</Text>
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
        backgroundColor: '#ffebee',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    
    // ATENÇÃO AQUI: paddingBottom foi aumentado para 150 para criar "espaço extra" de rolagem no final da tela
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
    inputIcon: { marginRight: 5 },
    currencySymbol: { fontSize: 18, fontWeight: 'bold', color: '#d32f2f', marginRight: 10 },
    inputText: { flex: 1, height: '100%', color: '#333', fontSize: 16 },
    
    categoriasGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20, gap: 8 },
    catButton: { 
        backgroundColor: '#fff', 
        paddingVertical: 10, 
        paddingHorizontal: 16, 
        borderRadius: 20, 
        borderWidth: 1,
        borderColor: '#ddd',
    },
    catButtonAtivo: { backgroundColor: '#d32f2f', borderColor: '#d32f2f' },
    catText: { color: '#555', fontSize: 14, fontWeight: '500' },
    catTextAtivo: { color: '#fff', fontWeight: 'bold' },

    searchButton: {
        backgroundColor: '#546e7a',
        width: 55,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    successBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f5e9',
        padding: 10,
        borderRadius: 8,
        marginBottom: 20,
    },
    successText: { color: '#2e7d32', fontWeight: '600', marginLeft: 8, fontSize: 14 },
    
    saveButton: { 
        flexDirection: 'row',
        backgroundColor: '#d32f2f', 
        height: 55, 
        borderRadius: 12, 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginTop: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});