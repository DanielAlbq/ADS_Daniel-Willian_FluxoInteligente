import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; //

export default function CategoriaScreen() {
    const [categorias, setCategorias] = useState([]);
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [tipo, setTipo] = useState('DESPESA');
    const [loading, setLoading] = useState(false);

    const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/categorias`;

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
                    descricao,
                    tipo
                })
            });

            if (response.status === 201) {
                Alert.alert("Sucesso", "Categoria criada!");
                setNome('');
                setDescricao('');
                setTipo('DESPESA');
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

    const deletarCategoria = async (id) => {
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 204) {
                Alert.alert("Sucesso", "Categoria excluída!");
                buscarCategorias();
            } else {
                Alert.alert("Erro", "Não foi possível excluir a categoria.");
            }
        } catch (error) {
            Alert.alert("Erro", "Falha de conexão com o servidor.");
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

                <Text style={styles.label}>Tipo de Categoria:</Text>
                <View style={styles.tipoSelector}>
                    <TouchableOpacity
                        style={[
                            styles.selectorButton,
                            tipo === 'RECEITA' ? styles.selectorReceitaAtivo : styles.selectorInativo
                        ]}
                        onPress={() => setTipo('RECEITA')}
                    >
                        <Text style={[
                            styles.selectorButtonText,
                            tipo === 'RECEITA' ? styles.selectorTextReceitaAtivo : styles.selectorTextInativo
                        ]}>
                            RECEITA
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.selectorButton,
                            tipo === 'DESPESA' ? styles.selectorDespesaAtivo : styles.selectorInativo
                        ]}
                        onPress={() => setTipo('DESPESA')}
                    >
                        <Text style={[
                            styles.selectorButtonText,
                            tipo === 'DESPESA' ? styles.selectorTextDespesaAtivo : styles.selectorTextInativo
                        ]}>
                            DESPESA
                        </Text>
                    </TouchableOpacity>
                </View>

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
                    <View style={[
                        styles.itemLista,
                        item.tipo === 'RECEITA' ? styles.itemListaReceita : styles.itemListaDespesa
                    ]}>
                        <View style={styles.itemInfo}>
                            <View style={styles.itemHeader}>
                                <Text style={styles.itemNome}>{item.nome}</Text>
                                <View style={[
                                    styles.badge,
                                    item.tipo === 'RECEITA' ? styles.badgeReceita : styles.badgeDespesa
                                ]}>
                                    <Text style={[
                                        styles.badgeText,
                                        item.tipo === 'RECEITA' ? styles.badgeTextReceita : styles.badgeTextDespesa
                                    ]}>
                                        {item.tipo === 'RECEITA' ? 'Receita' : 'Despesa'}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.itemDescricao}>{item.descricao}</Text>
                        </View>
                        <TouchableOpacity style={styles.deleteButton} onPress={() => deletarCategoria(item.id)}>
                            <Text style={styles.deleteIcon}>🗑</Text>
                        </TouchableOpacity>
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
    label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 8, marginTop: 5 },
    tipoSelector: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    selectorButton: { flex: 1, height: 40, borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    selectorInativo: { backgroundColor: '#f5f5f5', borderColor: '#ddd' },
    selectorReceitaAtivo: { backgroundColor: '#e8f5e9', borderColor: '#2e7d32' },
    selectorDespesaAtivo: { backgroundColor: '#ffebee', borderColor: '#d32f2f' },
    selectorButtonText: { fontWeight: 'bold', fontSize: 14 },
    selectorTextInativo: { color: '#777' },
    selectorTextReceitaAtivo: { color: '#2e7d32' },
    selectorTextDespesaAtivo: { color: '#d32f2f' },
    button: { height: 45, backgroundColor: '#2e7d32', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    subtitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    itemLista: { padding: 15, backgroundColor: '#fff', marginBottom: 10, borderRadius: 8, borderLeftWidth: 5, elevation: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    itemListaReceita: { borderLeftColor: '#2e7d32' },
    itemListaDespesa: { borderLeftColor: '#d32f2f' },
    itemInfo: { flex: 1 },
    itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    itemNome: { fontSize: 16, fontWeight: 'bold' },
    badge: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4 },
    badgeReceita: { backgroundColor: '#e8f5e9' },
    badgeDespesa: { backgroundColor: '#ffebee' },
    badgeText: { fontSize: 11, fontWeight: 'bold' },
    badgeTextReceita: { color: '#2e7d32' },
    badgeTextDespesa: { color: '#d32f2f' },
    itemDescricao: { fontSize: 14, color: '#666', marginTop: 4 },
    emptyText: { textAlign: 'center', color: '#999', marginTop: 20 },
    deleteButton: { padding: 10, justifyContent: 'center', alignItems: 'center' },
    deleteIcon: { fontSize: 24, fontWeight: 'bold', color: '#d32f2f' }


});