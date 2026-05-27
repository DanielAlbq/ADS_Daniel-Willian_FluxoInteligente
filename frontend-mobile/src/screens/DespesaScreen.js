import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function DespesaScreen({ navigation }) {
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const tipo = 'DESPESA';
    const [categoriaId, setCategoriaId] = useState(null);
    const [fornecedorId, setFornecedorId] = useState(null);

    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(false);

    // Novos estados para a busca de fornecedor
    const [cnpjBusca, setCnpjBusca] = useState('');
    const [nomeFornecedorLocalizado, setNomeFornecedorLocalizado] = useState('');

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

            // ADICIONE ESTA LINHA PARA DEPURAR:
            console.log("DADOS DA CATEGORIA:", response.data);

            // Se o seu console mostrar um objeto com "content", mude a linha abaixo parra:
            // setCategorias(response.data.content);
            setCategorias(response.data);

        } catch (error) {
            console.error("Erro ao buscar categorias:", error);
            Alert.alert("Erro", "Não foi possível carregar as categorias.");
        }
    };

    // Nova função para buscar o fornecedor pelo CNPJ
    const buscarFornecedorPorCnpj = async () => {
        if (!cnpjBusca) {
            Alert.alert("Aviso", "Digite um CNPJ para buscar.");
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
            const response = await axios.get(`${API_URL_FORNECEDORES}/cnpj/${cnpjBusca}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Se encontrou, salva o ID para o lançamento e o Nome para feedback visual
            setFornecedorId(response.data.id);
            setNomeFornecedorLocalizado(response.data.nome);

        } catch (error) {
            // Se o backend retornar 404, o fornecedor não existe
            if (error.response && error.response.status === 404) {
                setFornecedorId(null);
                setNomeFornecedorLocalizado('');

                Alert.alert(
                    "Fornecedor não encontrado",
                    "Esse CNPJ não está cadastrado no sistema. Deseja cadastrar agora?",
                    [
                        { text: "Não", style: "cancel" },
                        {
                            text: "Sim",
                            onPress: () => navigation.navigate('FornecedorScreen', { cnpjPreenchido: cnpjBusca })
                        }
                    ]
                );
            } else {
                console.error("Erro ao buscar fornecedor:", error);
                Alert.alert("Erro", "Falha ao buscar fornecedor. Tente novamente.");
            }
        } finally {
            setLoading(false);
        }
    };

    const salvarLancamento = async () => {
        if (!descricao || !valor || !categoriaId) {
            Alert.alert("Aviso", "Preencha a descrição, valor e escolha uma categoria.");
            return;
        }

        const valorFormatado = valor.replace(',', '.');

        setLoading(true);
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
                Alert.alert("Sucesso", "Despesa registrada!");
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
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Nova Despesa</Text>

            <TextInput
                style={styles.input}
                placeholder="Descrição (ex: Mercado)"
                value={descricao}
                onChangeText={setDescricao}
            />

            <TextInput
                style={styles.input}
                placeholder="Valor (R$)"
                keyboardType="numeric"
                value={valor}
                onChangeText={setValor}
            />

            <Text style={styles.label}>Selecione a Categoria:</Text>

            <View style={styles.categoriasGrid}>
                {categorias.map((cat) => (
                    <TouchableOpacity
                        key={cat.id}
                        style={[styles.catButton, categoriaId === cat.id && styles.catButtonAtivo]}
                        onPress={() => setCategoriaId(cat.id)}
                    >
                        <Text style={[styles.catText, categoriaId === cat.id && styles.catTextAtivo]}>
                            {cat.nome}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Nova seção de Fornecedor */}
            <Text style={styles.label}>Buscar Fornecedor (CNPJ):</Text>
            <View style={styles.searchContainer}>
                <TextInput
                    style={[styles.input, styles.searchInput]}
                    placeholder="Digite apenas números"
                    keyboardType="numeric"
                    value={cnpjBusca}
                    onChangeText={setCnpjBusca}
                    onBlur={buscarFornecedorPorCnpj} // Realiza a busca automaticamente ao sair do campo
                />
                <TouchableOpacity style={styles.searchButton} onPress={buscarFornecedorPorCnpj} disabled={loading}>
                    <Text style={styles.searchButtonText}>Buscar</Text>
                </TouchableOpacity>
            </View>

            {nomeFornecedorLocalizado ? (
                <Text style={styles.successText}>
                    ✓ Fornecedor vinculado: {nomeFornecedorLocalizado}
                </Text>
            ) : null}

            <TouchableOpacity style={styles.saveButton} onPress={salvarLancamento} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>SALVAR DESPESA</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20 },
    input: { backgroundColor: '#fff', height: 50, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, fontSize: 16 },
    label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    categoriasGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 30 },
    catButton: { backgroundColor: '#e0e0e0', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, margin: 5 },
    catButtonAtivo: { backgroundColor: '#f44336' },
    catText: { color: '#555', fontSize: 14 },
    catTextAtivo: { color: '#fff', fontWeight: 'bold' },

    // Novos estilos para a área de busca
    searchContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    searchInput: { flex: 1, marginBottom: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 },
    searchButton: {
        backgroundColor: '#555',
        height: 50,
        justifyContent: 'center',
        paddingHorizontal: 15,
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8
    },
    searchButtonText: { color: '#fff', fontWeight: 'bold' },
    successText: { color: '#2e7d32', fontWeight: 'bold', marginBottom: 30, fontSize: 15 },

    saveButton: { backgroundColor: '#d32f2f', height: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});