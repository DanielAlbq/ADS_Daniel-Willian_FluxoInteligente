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
import { Switch } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function DespesaScreen({ navigation, route }) {
    const lancamentoEdit = route.params?.lancamentoEdit || null;
    const isModoEdicao = !!lancamentoEdit;

    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const tipo = 'DESPESA';
    const [categoriaId, setCategoriaId] = useState(null);
    const [fornecedorId, setFornecedorId] = useState(null);

    const [dataEscolhida, setDataEscolhida] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(false);

    const [cnpjBusca, setCnpjBusca] = useState('');
    const [nomeFornecedorLocalizado, setNomeFornecedorLocalizado] = useState('');
    const [buscandoFornecedor, setBuscandoFornecedor] = useState(false);
    
    const [isParcelado, setIsParcelado] = useState(false);
    const [quantidadeParcelas, setQuantidadeParcelas] = useState('2');

    const API_URL_LANCAMENTOS = `${process.env.EXPO_PUBLIC_API_URL}/lancamentos`;
    const API_URL_CATEGORIAS = `${process.env.EXPO_PUBLIC_API_URL}/categorias`;
    const API_URL_FORNECEDORES = `${process.env.EXPO_PUBLIC_API_URL}/fornecedores`;

    useEffect(() => {
        carregarCategorias();

        if (isModoEdicao) {
            setDescricao(lancamentoEdit.descricao);
            setCategoriaId(lancamentoEdit.categoria?.id);
            setFornecedorId(lancamentoEdit.fornecedor?.id);

            if (lancamentoEdit.fornecedor) {
                setNomeFornecedorLocalizado("Fornecedor já vinculado"); 
            }

            if (lancamentoEdit.valor) {
                const valorStringParaMascara = lancamentoEdit.valor.toFixed(2).toString();
                formatarMoeda(valorStringParaMascara);
            }

            if (lancamentoEdit.data) {
                const [ano, mes, dia] = lancamentoEdit.data.split('-');
                setDataEscolhida(new Date(ano, mes - 1, dia));
            }
        }
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

    const onChangeDate = (event, selectedDate) => {
        const currentDate = selectedDate || dataEscolhida;
        setShowDatePicker(Platform.OS === 'ios'); 
        setDataEscolhida(currentDate);
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

    // --- DELETAR LANÇAMENTO ---
    const deletarLancamento = () => {
        Alert.alert(
            "Excluir Lançamento?",
            "Esta ação não pode ser desfeita. ATENÇÃO: Se esta for uma despesa parcelada, TODAS as parcelas vinculadas a ela serão excluídas automaticamente.",
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
                            Alert.alert("Sucesso", "Lançamento excluído!");
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert("Erro", "Não foi possível excluir a despesa.");
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

        if (isParcelado && !isModoEdicao) {
            if (!quantidadeParcelas || quantidadeParcelas.trim() === '') {
                Alert.alert("Aviso", "A quantidade de parcelas não pode ficar vazia.");
                return;
            }

            const numParcelas = parseInt(quantidadeParcelas, 10);
            if (isNaN(numParcelas) || numParcelas <= 1) {
                Alert.alert("Aviso", "Para parcelar, a quantidade mínima é de 2 parcelas.");
                return;
            }
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
            const valorTratadoParaAPI = parseFloat(valor.replace(/\./g, '').replace(',', '.'));

            const payload = {
                descricao: descricao,
                valor: valorTratadoParaAPI,
                tipo: tipo,
                data: formatarDataAPI(dataEscolhida),
                categoria: { id: categoriaId },
                fornecedor: fornecedorId ? { id: fornecedorId } : null
            };

            let response;

            if (isModoEdicao) {
                response = await axios.put(`${API_URL_LANCAMENTOS}/${lancamentoEdit.id}`, payload, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } else if (isParcelado) {
                const payloadParcelado = {
                    lancamento: payload,
                    quantidadeParcelas: parseInt(quantidadeParcelas, 10)
                };
                response = await axios.post(`${API_URL_LANCAMENTOS}/parcelado`, payloadParcelado, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } else {
                response = await axios.post(API_URL_LANCAMENTOS, payload, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }

            if (response.status === 201 || response.status === 200) {
                Alert.alert("Sucesso", isModoEdicao ? "Despesa atualizada com sucesso!" : (isParcelado ? "Despesa parcelada registrada!" : "Despesa registrada com sucesso!"));
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
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#d32f2f" />
                </TouchableOpacity>
                
                <Text style={styles.headerTitle}>{isModoEdicao ? 'Editar Despesa' : 'Nova Despesa'}</Text>
                
                {/* --- LIXEIRA NO CABEÇALHO SÓ APARECE SE FOR EDIÇÃO --- */}
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
                            onChangeText={formatarMoeda}
                        />
                    </View>

                    <Text style={styles.sectionLabel}>Data do Vencimento / Pagamento</Text>
                    <TouchableOpacity 
                        style={styles.inputContainer} 
                        onPress={() => setShowDatePicker(true)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="calendar" size={20} color="#d32f2f" style={styles.inputIcon} />
                        <View style={{ flex: 1, justifyContent: 'center', height: '100%' }}>
                            <Text style={{ fontSize: 16, color: '#333' }}>
                                {formatarDataVisual(dataEscolhida)}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={dataEscolhida}
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
                            <Text style={styles.successText}>{nomeFornecedorLocalizado}</Text>
                        </View>
                    ) : null}

                    {!isModoEdicao && (
                        <>
                            <View style={[styles.inputContainer, { justifyContent: 'space-between', paddingVertical: 10, height: 'auto' }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="albums-outline" size={20} color="#d32f2f" style={styles.inputIcon} />
                                    <Text style={{ fontSize: 16, color: '#333', marginLeft: 5 }}>Repetir / Parcelar?</Text>
                                </View>
                                <Switch 
                                    value={isParcelado} 
                                    onValueChange={setIsParcelado} 
                                    trackColor={{ false: "#ccc", true: "#ffcdd2" }}
                                    thumbColor={isParcelado ? "#d32f2f" : "#f4f3f4"}
                                />
                            </View>

                            {isParcelado && (
                                <View style={[styles.inputContainer, { marginTop: -5 }]}>
                                    <Text style={{ marginRight: 10, color: '#555' }}>Nº de Parcelas:</Text>
                                    <TextInput
                                        style={styles.inputText}
                                        placeholder="Ex: 3"
                                        keyboardType="numeric"
                                        value={quantidadeParcelas}
                                        onChangeText={setQuantidadeParcelas}
                                    />
                                </View>
                            )}
                        </>
                    )}

                    <TouchableOpacity style={styles.saveButton} onPress={salvarLancamento} disabled={loading} activeOpacity={0.8}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name={isModoEdicao ? "save-outline" : "close-circle-outline"} size={22} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.saveButtonText}>{isModoEdicao ? "ATUALIZAR DESPESA" : "SALVAR DESPESA"}</Text>
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