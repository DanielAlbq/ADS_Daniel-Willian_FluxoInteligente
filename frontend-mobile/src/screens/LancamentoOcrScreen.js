import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker'; // <-- NOVO IMPORT DE PDF

export default function LancamentoOcrScreen({ navigation }) {
    // Estados padrão do lançamento
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

    // Estados do OCR
    const [imageUri, setImageUri] = useState(null);
    const [isPdf, setIsPdf] = useState(false); // Pra saber se mostramos a imagem ou o ícone do PDF
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

    // 1. FUNÇÃO DA CÂMERA
    const tirarFoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permissão negada", "É necessário permitir o acesso à câmera para tirar fotos.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            quality: 0.7,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
            setIsPdf(false);
            processarOcr(result.assets[0].uri, 'image/jpeg', 'camera.jpg');
        }
    };

    // 2. FUNÇÃO DA GALERIA
    const selecionarImagem = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permissão negada", "É necessário permitir o acesso à galeria.");
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

    // 3. FUNÇÃO DO PDF
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

    // Função unificada que recebe o arquivo e o tipo correto!
    const processarOcr = async (uri, mimeType, fileName) => {
        setLoadingOcr(true);
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');

            const formData = new FormData();
            formData.append('file', {
                uri: uri,
                name: fileName,
                type: mimeType,
            });

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
            console.error("Erro no OCR:", error);
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
            console.error("Erro ao salvar lançamento:", error);
            Alert.alert("Erro", "Não foi possível salvar a despesa.");
        } finally {
            setLoadingSalvar(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Lançamento Inteligente</Text>

            {/* BARRA DE AÇÕES (CÂMERA, GALERIA, PDF) */}
            <Text style={styles.label}>Escolha o Comprovante:</Text>
            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionButton} onPress={tirarFoto} disabled={loadingOcr}>
                    <Text style={styles.actionButtonText}>📷 Câmera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={selecionarImagem} disabled={loadingOcr}>
                    <Text style={styles.actionButtonText}>🖼️ Galeria</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={selecionarPdf} disabled={loadingOcr}>
                    <Text style={styles.actionButtonText}>📄 PDF</Text>
                </TouchableOpacity>
            </View>

            {loadingOcr && <ActivityIndicator color="#1976d2" size="large" style={{ marginVertical: 20 }} />}

            {/* PREVIEW CONDICIONAL (IMAGEM vs PDF) */}
            {imageUri && !isPdf && !loadingOcr && (
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
            )}
            {isPdf && !loadingOcr && (
                <View style={styles.pdfPreview}>
                    <Text style={styles.pdfPreviewText}>📄 Documento PDF Selecionado</Text>
                </View>
            )}

            <View style={styles.divider} />

            <Text style={styles.label}>Revise os Dados:</Text>
            <TextInput style={styles.input} placeholder="Descrição (ex: Mercado)" value={descricao} onChangeText={setDescricao} />
            <TextInput style={styles.input} placeholder="Valor (R$)" keyboardType="numeric" value={valor} onChangeText={setValor} />
            <TextInput style={styles.input} placeholder="Data (DD/MM/AAAA)" value={data} onChangeText={setData} />

            <Text style={styles.label}>Categoria:</Text>
            <View style={styles.categoriasGrid}>
                {categorias.map((cat) => (
                    <TouchableOpacity
                        key={cat.id}
                        style={[styles.catButton, categoriaId === cat.id && styles.catButtonAtivo]}
                        onPress={() => setCategoriaId(cat.id)}
                    >
                        <Text style={[styles.catText, categoriaId === cat.id && styles.catTextAtivo]}>{cat.nome}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Fornecedor (CNPJ LIDO):</Text>
            <TextInput style={styles.input} value={cnpjBusca} onChangeText={setCnpjBusca} onBlur={() => buscarFornecedorPorCnpjOcr(cnpjBusca)} />

            {nomeFornecedorLocalizado ? (
                <Text style={styles.successText}>✓ {nomeFornecedorLocalizado}</Text>
            ) : null}

            <Text style={styles.label}>Texto Bruto Lido (Auditoria):</Text>
            <TextInput style={[styles.input, { height: 100 }]} value={textoLido} multiline={true} editable={false} />

            <TouchableOpacity style={styles.saveButton} onPress={salvarLancamento} disabled={loadingSalvar}>
                {loadingSalvar ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>SALVAR LANÇAMENTO</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
    title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },

    actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    actionButton: { flex: 1, backgroundColor: '#1976d2', height: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginHorizontal: 5 },
    actionButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

    previewImage: { width: '100%', height: 150, borderRadius: 8, marginBottom: 15, resizeMode: 'cover' },
    pdfPreview: { width: '100%', height: 80, backgroundColor: '#e0e0e0', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#ccc', borderStyle: 'dashed' },
    pdfPreviewText: { color: '#555', fontWeight: 'bold' },

    divider: { height: 1, backgroundColor: '#ddd', marginVertical: 15 },
    input: { backgroundColor: '#fff', height: 50, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 15, marginBottom: 15 },
    categoriasGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
    catButton: { backgroundColor: '#e0e0e0', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, margin: 5 },
    catButtonAtivo: { backgroundColor: '#f44336' },
    catText: { color: '#555', fontSize: 14 },
    catTextAtivo: { color: '#fff', fontWeight: 'bold' },
    successText: { color: '#2e7d32', fontWeight: 'bold', marginBottom: 20 },
    saveButton: { backgroundColor: '#2e7d32', height: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});