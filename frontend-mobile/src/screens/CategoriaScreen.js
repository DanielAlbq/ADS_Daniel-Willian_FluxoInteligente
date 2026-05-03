import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; //

export default function CategoriaScreen() {
    const [categorias, setCategorias] = useState([]);
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [loading, setLoading] = useState(false);

    const API_URL = "http://192.168.1.19:8080/api/categorias";

    useEffect(() => {
        buscarCategorias();
    }, []);

    const buscarCategorias = async () => {
        try {
            // Recupera o token para autorizar a busca
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');

            // A rota agora é genérica, o backend filtra pelo token
            const response = await fetch(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const dados = await response.json();
                setCategorias(dados);
            }
        } catch (error) {
            console.error("Erro ao buscar categorias:", error);
        }
    };

    const salvarCategoria = async () => {

        if (!nome || !descricao) {
            Alert.alert("Aviso", "Nome e Descrição são obrigatórios.");
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nome,
                    descricao

                })
            });

            if (response.status === 201) {
                Alert.alert("Sucesso", "Categoria criada!");
                setNome('');
                setDescricao('');
                buscarCategorias();
            } else {
                Alert.alert("Erro", "Não foi possível criar a categoria.");
            }
        } catch (error) {
            Alert.alert("Erro", "Falha de conexão com o servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Minhas Categorias</Text>

            <View style={styles.formCard}>
                <TextInput
                    style={styles.input}
                    placeholder="Nome (ex: Alimentação)"
                    value={nome}
                    onChangeText={setNome}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Descrição (ex: Supermercado)"
                    value={descricao}
                    onChangeText={setDescricao}
                />
                <TouchableOpacity style={styles.button} onPress={salvarCategoria} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>ADICIONAR CATEGORIA</Text>
                    )}
                </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>Categorias Cadastradas</Text>

            <FlatList
                data={categorias}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.itemLista}>
                        <Text style={styles.itemNome}>{item.nome}</Text>
                        <Text style={styles.itemDescricao}>{item.descricao}</Text>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma categoria cadastrada.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#2e7d32' },
    formCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 20, elevation: 2 },
    input: { height: 45, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 15, marginBottom: 10 },
    button: { height: 45, backgroundColor: '#2e7d32', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    subtitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    itemLista: { padding: 15, backgroundColor: '#fff', marginBottom: 10, borderRadius: 8, borderLeftWidth: 5, borderLeftColor: '#2e7d32', elevation: 1 },
    itemNome: { fontSize: 16, fontWeight: 'bold' },
    itemDescricao: { fontSize: 14, color: '#666', marginTop: 4 },
    emptyText: { textAlign: 'center', color: '#999', marginTop: 20 }
});