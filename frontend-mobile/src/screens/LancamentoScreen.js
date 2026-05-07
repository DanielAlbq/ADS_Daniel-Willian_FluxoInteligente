import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function LancamentoScreen({ navigation }) {
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const [tipo, setTipo] = useState('DESPESA');
    const [categoriaId, setCategoriaId] = useState(null);

    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(false);

    const API_URL_LANCAMENTOS = `${process.env.EXPO_PUBLIC_API_URL}/lancamentos`;
    const API_URL_CATEGORIAS = `${process.env.EXPO_PUBLIC_API_URL}/categorias`;

    useEffect(() => {
        carregarCategorias();
    }, []);

    const carregarCategorias = async () => {
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');

            // Chamada limpa: O backend usará o token para saber de qual usuário são as categorias
            const response = await axios.get(API_URL_CATEGORIAS, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCategorias(response.data);
        } catch (error) {
            console.error("Erro ao buscar categorias:", error);
            Alert.alert("Erro", "Não foi possível carregar as categorias.");
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
                // Passar id da categoria que o usuário selecionar
                categoria: { id: categoriaId }
            };

            const response = await axios.post(API_URL_LANCAMENTOS, payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 201 || response.status === 200) {
                Alert.alert("Sucesso", "Lançamento registrado!");
                navigation.goBack();
            }
        } catch (error) {
            console.error("Erro ao salvar lançamento:", error);
            Alert.alert("Erro", "Não foi possível salvar o lançamento.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Novo Lançamento</Text>

            <View style={styles.tipoContainer}>
                <TouchableOpacity
                    style={[styles.tipoButton, tipo === 'RECEITA' && styles.tipoReceitaAtivo]}
                    onPress={() => setTipo('RECEITA')}
                >
                    <Text style={[styles.tipoText, tipo === 'RECEITA' && styles.tipoTextAtivo]}>⬆️ RECEITA</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tipoButton, tipo === 'DESPESA' && styles.tipoDespesaAtivo]}
                    onPress={() => setTipo('DESPESA')}
                >
                    <Text style={[styles.tipoText, tipo === 'DESPESA' && styles.tipoTextAtivo]}>⬇️ DESPESA</Text>
                </TouchableOpacity>
            </View>

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

            <TouchableOpacity style={styles.saveButton} onPress={salvarLancamento} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>SALVAR LANÇAMENTO</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20 },
    tipoContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    tipoButton: { flex: 1, padding: 15, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, alignItems: 'center', marginHorizontal: 5, backgroundColor: '#fff' },
    tipoReceitaAtivo: { backgroundColor: '#e8f5e9', borderColor: '#4caf50' },
    tipoDespesaAtivo: { backgroundColor: '#ffebee', borderColor: '#f44336' },
    tipoText: { fontWeight: 'bold', color: '#666' },
    tipoTextAtivo: { color: '#333' },
    input: { backgroundColor: '#fff', height: 50, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, fontSize: 16 },
    label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    categoriasGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 30 },
    catButton: { backgroundColor: '#e0e0e0', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, margin: 5 },
    catButtonAtivo: { backgroundColor: '#2e7d32' },
    catText: { color: '#555', fontSize: 14 },
    catTextAtivo: { color: '#fff', fontWeight: 'bold' },
    saveButton: { backgroundColor: '#1b5e20', height: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});