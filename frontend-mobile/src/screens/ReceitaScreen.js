import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';

export default function ReceitaScreen({ navigation }) {
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const [data, setData] = useState(new Date()); // Guarde como objeto Date inicialmente
    const [showPicker, setShowPicker] = useState(false);
    const tipo = 'RECEITA';
    const [categoriaId, setCategoriaId] = useState(null);

    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(false);

    const API_URL_LANCAMENTOS = `${process.env.EXPO_PUBLIC_API_URL}/lancamentos`;
    const API_URL_CATEGORIAS = `${process.env.EXPO_PUBLIC_API_URL}/categorias`;

    useEffect(() => {
        carregarCategorias();
    }, []);

    const onChangeData = (event, selectedDate) => {
        setShowPicker(false); // Fecha o picker
        if (selectedDate) {
            setData(selectedDate);
        }
    };

    const carregarCategorias = async () => {
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
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

            const dataISO = data.toISOString().split('T')[0];

            const payload = {
                descricao: descricao,
                valor: parseFloat(valor.replace(',', '.')),
                tipo: tipo,
                dataPagamento: dataISO, // Usa a data formatada aqui
                categoria: { id: categoriaId }
            };

            const response = await axios.post(API_URL_LANCAMENTOS, payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 201 || response.status === 200) {
                Alert.alert("Sucesso", "Receita registrada!");
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
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Nova Receita</Text>

            <TextInput
                style={styles.input}
                placeholder="Descrição (ex: Salário)"
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

            <Text style={styles.label}>Data do Pagamento:</Text>
            <TouchableOpacity
                style={styles.input}
                onPress={() => setShowPicker(true)}
            >
                {/* Exibe para o usuário no formato BR, mas o estado guarda o objeto Date */}
                <Text style={{ lineHeight: 45, fontSize: 16 }}>
                    {data.toLocaleDateString('pt-BR')}
                </Text>
            </TouchableOpacity>

            {showPicker && (
                <DateTimePicker
                    value={data}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                        setShowPicker(false);
                        if (selectedDate) setData(selectedDate);
                    }}
                />
            )}

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
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>SALVAR RECEITA</Text>}
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
    catButtonAtivo: { backgroundColor: '#4caf50' },
    catText: { color: '#555', fontSize: 14 },
    catTextAtivo: { color: '#fff', fontWeight: 'bold' },
    saveButton: { backgroundColor: '#2e7d32', height: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
