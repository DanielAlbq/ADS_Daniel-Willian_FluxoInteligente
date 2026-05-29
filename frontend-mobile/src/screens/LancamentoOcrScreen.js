import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';

export default function LancamentoOcrScreen({ navigation }) {
    // Estados padrão do lançamento
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const [textoLido, setTextoLido] = useState('');
    const tipo = 'DESPESA';
    const [categoriaId, setCategoriaId] = useState(null);
    const [fornecedorId, setFornecedorId] = useState(null);
    const [cnpjBusca, setCnpjBusca] = useState('');
    const [nomeFornecedorLocalizado, setNomeFornecedorLocalizado] = useState('');
    const [categorias, setCategorias] = useState([]);

    // Estados do OCR e carregamento
    const [imageUri, setImageUri] = useState(null);
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

    // Função para escolher ou tirar foto do comprovante
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
            processarOcr(result.assets[0].uri);
        }
    };

    // Função que envia a imagem para o backend e processa o retorno
    const processarOcr = async (uri) => {
        setLoadingOcr(true);
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');

            const formData = new FormData();
            formData.append('file', {
                uri: uri,
                name: 'comprovante.jpg',
                type: 'image/jpeg',
            });

            const response = await axios.post(`${API_URL}/ocr/ler-nota`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log("Resposta do Backend OCR:", response.data);

            if (response.data.textoLido) {
                setTextoLido(response.data.textoLido.toString());
            }
            // 1. Preenche o Valor Total se a IA encontrou
            if (response.data.valorTotal) {
                setValor(response.data.valorTotal.toString());
            }

            // 2. Preenche o CNPJ e já busca o Fornecedor no banco
            if (response.data.cnpj) {
                setCnpjBusca(response.data.cnpj);
                buscarFornecedorPorCnpjOcr(response.data.cnpj);
            }

            // 3. Define uma descrição padrão
            setDescricao("Despesa lida via OCR");

            setTextoLido(response.data.textoLido);

            Alert.alert("Sucesso", "Imagem processada! Revise os dados extraídos.");

        } catch (error) {
            console.error("Erro no OCR:", error);
            Alert.alert("Erro OCR", "Não foi possível ler os dados da imagem.");
        } finally {
            setLoadingOcr(false);
        }
    };

    // Lógica de busca de fornecedor pelo CNPJ
    const buscarFornecedorPorCnpjOcr = async (cnpj) => {
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
            const response = await axios.get(`${API_URL}/fornecedores/cnpj/${cnpj}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setFornecedorId(response.data.id);
            setNomeFornecedorLocalizado(response.data.nome);
        } catch (error) {
            // Se der 404, apenas deixa o usuário cadastrar depois
            setFornecedorId(null);
            setNomeFornecedorLocalizado('');
        }
    };

    // Função para persistir o lançamento no banco de dados
    const salvarLancamento = async () => {
        if (!descricao || !valor || !categoriaId) {
            Alert.alert("Aviso", "Preencha a descrição, valor e escolha uma categoria.");
            return;
        }

        const valorFormatado = valor.replace(',', '.');

        setLoadingSalvar(true);
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');

            const payload = {
                descricao: descricao,
                valor: parseFloat(valorFormatado),
                tipo: tipo,
                data: new Date().toISOString().split('T')[0],
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
            <Text style={styles.title}>Lançamento Inteligente (OCR)</Text>

            {/* Área de Captura de Imagem */}
            <TouchableOpacity style={styles.imageButton} onPress={selecionarImagem} disabled={loadingOcr}>
                {loadingOcr ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.imageButtonText}>📸 Escanear Cupom Fiscal</Text>
                )}
            </TouchableOpacity>

            {imageUri && (
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
            )}

            <View style={styles.divider} />

            {/* O formulário abaixo é preenchido automaticamente pelo OCR, mas o usuário pode editar */}
            <Text style={styles.label}>Revise os Dados:</Text>

            <TextInput style={styles.input} placeholder="Descrição (ex: Mercado)" value={descricao} onChangeText={setDescricao} />
            <TextInput style={styles.input} placeholder="Valor (R$)" keyboardType="numeric" value={valor} onChangeText={setValor} />
            <TextInput style={styles.input} placeholder="Texto Extraido" value={textoLido} onChangeText={setTextoLido} />


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

            <TouchableOpacity style={styles.saveButton} onPress={salvarLancamento} disabled={loadingSalvar}>
                {loadingSalvar ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>SALVAR LANÇAMENTO</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
    title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    imageButton: { backgroundColor: '#1976d2', height: 60, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
    imageButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    previewImage: { width: '100%', height: 150, borderRadius: 8, marginBottom: 15, resizeMode: 'cover' },
    divider: { height: 1, backgroundColor: '#ddd', marginVertical: 15 },
    input: { backgroundColor: '#fff', height: 50, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 15, marginBottom: 15 },
    label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    categoriasGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
    catButton: { backgroundColor: '#e0e0e0', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, margin: 5 },
    catButtonAtivo: { backgroundColor: '#f44336' },
    catText: { color: '#555', fontSize: 14 },
    catTextAtivo: { color: '#fff', fontWeight: 'bold' },
    successText: { color: '#2e7d32', fontWeight: 'bold', marginBottom: 20 },
    saveButton: { backgroundColor: '#2e7d32', height: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});