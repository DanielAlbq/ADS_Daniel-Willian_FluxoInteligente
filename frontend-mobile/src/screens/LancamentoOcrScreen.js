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
    Image, 
    StatusBar,
    KeyboardAvoidingView, 
    Platform              
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';

export default function LancamentoOcrScreen({ navigation }) {
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const [data, setData] = useState('');
    const [textoLido, setTextoLido] = useState('');
    const tipo = 'DESPESA';
    const [categoriaId, setCategoriaId] = useState(null);
    const [fornecedorId, setFornecedorId] = useState(null);
    const [cnpjBusca, setCnpjBusca] = useState('');
    const [nomeFornecedorLocalizado, setNomeFornecedorLocalizado] = useState('');
    const [categorias, setCategorias] = useState([]);

    const [imageUri, setImageUri] = useState(null);
    const [isPdf, setIsPdf] = useState(false); 
    const [loadingOcr, setLoadingOcr] = useState(false);
    const [loadingSalvar, setLoadingSalvar] = useState(false);

    const API_URL = process.env.EXPO_PUBLIC_API_URL;
    const API_URL_LANCAMENTOS = `${API_URL}/lancamentos`;

    useEffect(() => {
        carregarCategorias();
    }, []);

    const carregarCategorias = async () => {
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
            const response = await axios.get(`${API_URL}/categorias?tipo=DESPESA`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCategorias(response.data);
        } catch (error) {
            Alert.alert("Erro", "Não foi possível carregar as categorias.");
        }
    };

    const tirarFoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permissão negada", "É necessário permitir acesso à câmera.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
            setIsPdf(false);
            processarOcr(result.assets[0].uri, 'image/jpeg', 'camera.jpg');
        }
    };

    const selecionarImagem = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permissão negada", "É necessário permitir acesso à galeria.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
            setIsPdf(false);
            processarOcr(result.assets[0].uri, 'image/jpeg', 'galeria.jpg');
        }
    };

    const selecionarPdf = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (!result.canceled) {
                const doc = result.assets[0];
                setImageUri(doc.uri);
                setIsPdf(true);
                processarOcr(doc.uri, 'application/pdf', doc.name);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const processarOcr = async (uri, mimeType, fileName) => {
        setLoadingOcr(true);
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
            const formData = new FormData();
            formData.append('file', { uri: uri, name: fileName, type: mimeType });

            const response = await axios.post(`${API_URL}/ocr/ler-nota`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.valorTotal) setValor(response.data.valorTotal.toString());
            if (response.data.data) setData(response.data.data);
            if (response.data.descricao) setDescricao(response.data.descricao);
            if (response.data.cnpj) {
                setCnpjBusca(response.data.cnpj);
                buscarFornecedorPorCnpjOcr(response.data.cnpj);
            }
            if (response.data.textoLido) {
                setTextoLido(response.data.textoLido);
            }

            Alert.alert("Sucesso", "Documento processado! Revise os dados extraídos.");
        } catch (error) {
            Alert.alert("Erro OCR", "Não foi possível ler os dados do documento.");
        } finally {
            setLoadingOcr(false);
        }
    };

    const buscarFornecedorPorCnpjOcr = async (cnpj) => {
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
            const response = await axios.get(`${API_URL}/fornecedores/cnpj/${cnpj}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setFornecedorId(response.data.id);
            setNomeFornecedorLocalizado(response.data.nome);
        } catch (error) {
            setFornecedorId(null);
            setNomeFornecedorLocalizado('');
        }
    };

    const salvarLancamento = async () => {
        if (!descricao || !valor || !categoriaId) {
            Alert.alert("Aviso", "Preencha a descrição, valor e escolha uma categoria.");
            return;
        }

        const valorFormatado = valor.replace(',', '.');
        let dataParaEnvio = new Date().toISOString().split('T')[0];

        if (data) {
            if (data.includes('/')) {
                const [dia, mes, ano] = data.split('/');
                dataParaEnvio = `${ano}-${mes}-${dia}`;
            } else {
                dataParaEnvio = data;
            }
        }

        setLoadingSalvar(true);
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
            const payload = {
                descricao: descricao,
                valor: parseFloat(valorFormatado),
                tipo: tipo,
                data: dataParaEnvio,
                categoria: { id: categoriaId },
                fornecedor: fornecedorId ? { id: fornecedorId } : null
            };

            const response = await axios.post(API_URL_LANCAMENTOS, payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 201 || response.status === 200) {
                Alert.alert("Sucesso", "Lançamento via OCR salvo com sucesso!");
                navigation.goBack();
            }
        } catch (error) {
            Alert.alert("Erro", "Não foi possível salvar a despesa.");
        } finally {
            setLoadingSalvar(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

            {/* CABEÇALHO FIXO */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1976d2" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Leitura Inteligente (OCR)</Text>
                <View style={{ width: 40 }} /> 
            </View>

            {/* PROTEÇÃO AVANÇADA DO TECLADO */}
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

                    <Text style={styles.sectionLabel}>Escolha o Comprovante</Text>
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.actionCard} onPress={tirarFoto} disabled={loadingOcr} activeOpacity={0.7}>
                            <View style={[styles.iconWrapper, { backgroundColor: '#e3f2fd' }]}>
                                <Ionicons name="camera-outline" size={28} color="#1976d2" />
                            </View>
                            <Text style={styles.actionCardText}>Câmera</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.actionCard} onPress={selecionarImagem} disabled={loadingOcr} activeOpacity={0.7}>
                            <View style={[styles.iconWrapper, { backgroundColor: '#e8f5e9' }]}>
                                <Ionicons name="image-outline" size={28} color="#2e7d32" />
                            </View>
                            <Text style={styles.actionCardText}>Galeria</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionCard} onPress={selecionarPdf} disabled={loadingOcr} activeOpacity={0.7}>
                            <View style={[styles.iconWrapper, { backgroundColor: '#ffebee' }]}>
                                <Ionicons name="document-text-outline" size={28} color="#d32f2f" />
                            </View>
                            <Text style={styles.actionCardText}>PDF</Text>
                        </TouchableOpacity>
                    </View>

                    {loadingOcr && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator color="#1976d2" size="large" />
                            <Text style={styles.loadingText}>A processar documento através de IA...</Text>
                        </View>
                    )}

                    {imageUri && !isPdf && !loadingOcr && (
                        <View style={styles.previewContainer}>
                            <Image source={{ uri: imageUri }} style={styles.previewImage} />
                            <View style={styles.previewBadge}>
                                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                                <Text style={styles.previewBadgeText}>Imagem Carregada</Text>
                            </View>
                        </View>
                    )}
                    {isPdf && !loadingOcr && (
                        <View style={styles.pdfPreview}>
                            <Ionicons name="document-text" size={40} color="#d32f2f" />
                            <Text style={styles.pdfPreviewText}>Documento PDF Pronto</Text>
                        </View>
                    )}

                    <Text style={styles.sectionLabel}>Dados Extraídos (Revise)</Text>
                    
                    <View style={styles.inputContainer}>
                        <Ionicons name="pricetag-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput 
                            style={styles.inputText} 
                            placeholder="Descrição (ex: Mercado)" 
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

                    <View style={styles.inputContainer}>
                        <Ionicons name="calendar-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput 
                            style={styles.inputText} 
                            placeholder="Data (DD/MM/AAAA)" 
                            placeholderTextColor="#888"
                            value={data} 
                            onChangeText={setData} 
                        />
                    </View>

                    <Text style={styles.sectionLabel}>Categoria da Despesa</Text>
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

                    <Text style={styles.sectionLabel}>Fornecedor (CNPJ LIDO)</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="business-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput 
                            style={styles.inputText} 
                            placeholder="Introduza o CNPJ"
                            placeholderTextColor="#888"
                            keyboardType="numeric"
                            value={cnpjBusca} 
                            onChangeText={setCnpjBusca} 
                            onBlur={() => buscarFornecedorPorCnpjOcr(cnpjBusca)} 
                        />
                    </View>

                    {nomeFornecedorLocalizado ? (
                        <View style={styles.successBadge}>
                            <Ionicons name="checkmark-circle" size={18} color="#2e7d32" />
                            <Text style={styles.successText}>Vinculado: {nomeFornecedorLocalizado}</Text>
                        </View>
                    ) : null}

                    <Text style={styles.sectionLabel}>Texto Bruto Lido (Auditoria)</Text>
                    <View style={[styles.inputContainer, { height: 100, alignItems: 'flex-start', paddingTop: 10, backgroundColor: '#f0f0f0' }]}>
                        <TextInput 
                            style={[styles.inputText, { textAlignVertical: 'top', color: '#555', fontSize: 13 }]} 
                            value={textoLido} 
                            multiline={true} 
                            editable={false} 
                            placeholder="O texto extraído da imagem aparecerá aqui..."
                            placeholderTextColor="#aaa"
                        />
                    </View>

                    <TouchableOpacity style={styles.saveButton} onPress={salvarLancamento} disabled={loadingSalvar} activeOpacity={0.8}>
                        {loadingSalvar ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="save-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.saveButtonText}>SALVAR LANÇAMENTO</Text>
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
        backgroundColor: '#e3f2fd',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    
    // Espaço extra para o teclado não cobrir os últimos campos
    scrollContent: { paddingHorizontal: 20, paddingBottom: 150, paddingTop: 10 },
    
    sectionLabel: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 12, marginTop: 15 },
    
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    actionCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 15,
        alignItems: 'center',
        marginHorizontal: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    iconWrapper: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    actionCardText: { color: '#444', fontSize: 13, fontWeight: '600' },

    loadingContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 25 },
    loadingText: { marginTop: 10, color: '#1976d2', fontWeight: '500' },

    previewContainer: { marginTop: 15, position: 'relative' },
    previewImage: { width: '100%', height: 180, borderRadius: 12, resizeMode: 'cover', borderWidth: 1, borderColor: '#ddd' },
    previewBadge: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    previewBadgeText: { color: '#fff', fontSize: 12, marginLeft: 5, fontWeight: 'bold' },

    pdfPreview: { marginTop: 15, width: '100%', height: 120, backgroundColor: '#fff', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0', borderStyle: 'dashed' },
    pdfPreviewText: { color: '#555', fontWeight: 'bold', marginTop: 10 },

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
    currencySymbol: { fontSize: 18, fontWeight: 'bold', color: '#1976d2', marginRight: 10 },
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

    successBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', padding: 10, borderRadius: 8, marginBottom: 20 },
    successText: { color: '#2e7d32', fontWeight: '600', marginLeft: 8, fontSize: 14 },
    
    saveButton: { 
        flexDirection: 'row',
        backgroundColor: '#1976d2', 
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