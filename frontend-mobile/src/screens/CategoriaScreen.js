import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

export default function CategoriaScreen({ navigation }) {
    const [nome, setNome] = useState('');
    const [tipo, setTipo] = useState('DESPESA'); // Padrão
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingList, setLoadingList] = useState(true);


    const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/categorias`;

    useFocusEffect(
        useCallback(() => {
            carregarCategorias();
        }, [])
    );

    const carregarCategorias = async () => {
        setLoadingList(true);
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
            const response = await axios.get(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCategorias(response.data);
        } catch (error) {
            console.error(error);
            Alert.alert("Erro", "Falha ao carregar as categorias.");
        } finally {
            setLoadingList(false);
        }
    };

    const salvarCategoria = async () => {
        if (!nome) {
            Alert.alert("Aviso", "O nome da categoria é obrigatório.");
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
            await axios.post(API_URL, { nome, tipo }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            Alert.alert("Sucesso", "Categoria adicionada!");
            setNome('');
            carregarCategorias();
        } catch (error) {
            console.error(error);
            Alert.alert("Erro", "Não foi possível salvar a categoria.");
        } finally {
            setLoading(false);
        }
    };

    const deletarCategoria = async (id) => {
        Alert.alert("Excluir", "Deseja realmente excluir esta categoria?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Excluir",
                style: "destructive",
                onPress: async () => {
                    try {
                        const token = await AsyncStorage.getItem('@FluxoInteligente:token');
                        await axios.delete(`${API_URL}/${id}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        carregarCategorias();
                    } catch (error) {
                        Alert.alert("Erro", "Não foi possível excluir. Talvez ela esteja em uso.");
                    }
                }
            }
        ]);
    };

    const renderItem = ({ item }) => {
        const isReceita = item.tipo === 'RECEITA';
        return (
            <View style={styles.card}>
                <View style={[styles.iconWrapper, { backgroundColor: isReceita ? '#e8f5e9' : '#ffebee' }]}>
                    <Ionicons name="pricetag-outline" size={20} color={isReceita ? '#2e7d32' : '#d32f2f'} />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardNome}>{item.nome}</Text>
                    <Text style={[styles.cardTipo, { color: isReceita ? '#2e7d32' : '#d32f2f' }]}>
                        {isReceita ? 'Receita' : 'Despesa'}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => deletarCategoria(item.id)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={20} color="#d32f2f" />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

            {/* CABEÇALHO */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Categorias</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* FORMULÁRIO DE ADIÇÃO */}
            <View style={styles.formContainer}>
                <Text style={styles.sectionTitle}>Nova Categoria</Text>

                <View style={styles.inputContainer}>
                    <Ionicons name="pricetag-outline" size={20} color="#1976d2" style={styles.inputIcon} />
                    <TextInput
                        style={styles.inputText}
                        placeholder="Nome (ex: Alimentação)"
                        placeholderTextColor="#888"
                        value={nome}
                        onChangeText={setNome}
                    />

                </View>


                {/* SELETOR DE TIPO (CHIPS) */}
                <View style={styles.tipoContainer}>
                    <TouchableOpacity
                        style={[styles.tipoBtn, tipo === 'RECEITA' && styles.tipoBtnReceita]}
                        onPress={() => setTipo('RECEITA')}
                    >
                        <Text style={[styles.tipoTexto, tipo === 'RECEITA' && styles.tipoTextoAtivo]}>Receita</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tipoBtn, tipo === 'DESPESA' && styles.tipoBtnDespesa]}
                        onPress={() => setTipo('DESPESA')}
                    >
                        <Text style={[styles.tipoTexto, tipo === 'DESPESA' && styles.tipoTextoAtivo]}>Despesa</Text>
                    </TouchableOpacity>
                </View>


                <TouchableOpacity style={styles.saveBtn} onPress={salvarCategoria} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.saveBtnText}>ADICIONAR</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* LISTA DE CATEGORIAS */}
            <View style={styles.listContainer}>
                <Text style={styles.sectionTitle}>Categorias Registadas</Text>
                {loadingList ? (
                    <ActivityIndicator size="large" color="#1976d2" style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={categorias}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>Nenhuma categoria encontrada.</Text>
                        }
                    />
                )}
            </View>
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
        backgroundColor: '#e0e0e0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },

    formContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderColor: '#eee',
        backgroundColor: '#fff',
        paddingTop: 10,
    },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 15, textTransform: 'uppercase' },

    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        marginBottom: 15,
        paddingHorizontal: 15,
        height: 55,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    inputIcon: { marginRight: 10 },
    inputText: { flex: 1, height: '100%', color: '#333', fontSize: 16 },

    tipoContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    tipoBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: '#f5f5f5',
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    tipoBtnReceita: { backgroundColor: '#2e7d32', borderColor: '#2e7d32' },
    tipoBtnDespesa: { backgroundColor: '#d32f2f', borderColor: '#d32f2f' },
    tipoTexto: { fontSize: 14, fontWeight: '600', color: '#666' },
    tipoTextoAtivo: { color: '#fff', fontWeight: 'bold' },

    saveBtn: {
        flexDirection: 'row',
        backgroundColor: '#1976d2',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
    },
    saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

    listContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    cardInfo: { flex: 1 },
    cardNome: { fontSize: 15, fontWeight: 'bold', color: '#333' },
    cardTipo: { fontSize: 12, marginTop: 2, fontWeight: '500' },
    deleteBtn: { padding: 8 },
    emptyText: { textAlign: 'center', color: '#888', marginTop: 20 },
});