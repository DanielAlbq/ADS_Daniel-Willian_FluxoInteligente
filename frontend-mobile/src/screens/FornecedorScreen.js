import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

export default function FornecedorScreen({ route, navigation }) {
    // Parâmetro vindo de DespesaScreen
    const [cnpj, setCnpj] = useState(route.params?.cnpjPreenchido || '');
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    
    const [fornecedores, setFornecedores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingList, setLoadingList] = useState(true);

    const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/fornecedores`;

    useFocusEffect(
        useCallback(() => {
            carregarFornecedores();
        }, [])
    );

    const carregarFornecedores = async () => {
        setLoadingList(true);
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
            const response = await axios.get(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setFornecedores(response.data);
        } catch (error) {
            console.error(error);
            Alert.alert("Erro", "Falha ao carregar os fornecedores.");
        } finally {
            setLoadingList(false);
        }
    };

    const salvarFornecedor = async () => {
        if (!nome || !cnpj) {
            Alert.alert("Aviso", "Nome e CNPJ são obrigatórios.");
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
            await axios.post(API_URL, { nome, cnpj, telefone }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            Alert.alert("Sucesso", "Fornecedor cadastrado!");
            setNome('');
            setCnpj('');
            setTelefone('');
            carregarFornecedores();
        } catch (error) {
            console.error(error);
            Alert.alert("Erro", "Não foi possível salvar. Verifique se o CNPJ já existe.");
        } finally {
            setLoading(false);
        }
    };

    const deletarFornecedor = async (id) => {
        Alert.alert("Excluir", "Deseja remover este fornecedor?", [
            { text: "Cancelar", style: "cancel" },
            { 
                text: "Remover", 
                style: "destructive",
                onPress: async () => {
                    try {
                        const token = await AsyncStorage.getItem('@FluxoInteligente:token');
                        await axios.delete(`${API_URL}/${id}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        carregarFornecedores();
                    } catch (error) {
                        Alert.alert("Erro", "Não foi possível remover. Ele pode estar vinculado a despesas.");
                    }
                }
            }
        ]);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.iconWrapper}>
                <Ionicons name="business" size={20} color="#f57c00" />
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.cardNome}>{item.nome}</Text>
                <Text style={styles.cardCnpj}>CNPJ: {item.cnpj}</Text>
                {item.telefone ? <Text style={styles.cardCnpj}>Tel: {item.telefone}</Text> : null}
            </View>
            <TouchableOpacity onPress={() => deletarFornecedor(item.id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={20} color="#d32f2f" />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

            {/* CABEÇALHO */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Fornecedores</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                
                {/* FORMULÁRIO DE ADIÇÃO */}
                <View style={styles.formContainer}>
                    <Text style={styles.sectionTitle}>Novo Fornecedor</Text>
                    
                    <View style={styles.inputContainer}>
                        <Ionicons name="business-outline" size={20} color="#f57c00" style={styles.inputIcon} />
                        <TextInput
                            style={styles.inputText}
                            placeholder="Nome da Empresa"
                            placeholderTextColor="#888"
                            value={nome}
                            onChangeText={setNome}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="barcode-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.inputText}
                            placeholder="CNPJ (Apenas números)"
                            placeholderTextColor="#888"
                            keyboardType="numeric"
                            value={cnpj}
                            onChangeText={setCnpj}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.inputText}
                            placeholder="Telefone (Opcional)"
                            placeholderTextColor="#888"
                            keyboardType="phone-pad"
                            value={telefone}
                            onChangeText={setTelefone}
                        />
                    </View>

                    <TouchableOpacity style={styles.saveBtn} onPress={salvarFornecedor} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.saveBtnText}>CADASTRAR FORNECEDOR</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* LISTA DE FORNECEDORES */}
                <View style={styles.listContainer}>
                    <Text style={styles.sectionTitle}>Registos</Text>
                    {loadingList ? (
                        <ActivityIndicator size="large" color="#f57c00" style={{ marginTop: 20 }} />
                    ) : (
                        <FlatList
                            data={fornecedores}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderItem}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>Nenhum fornecedor cadastrado.</Text>
                            }
                        />
                    )}
                </View>

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
        marginBottom: 10,
        paddingHorizontal: 15,
        height: 50,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    inputIcon: { marginRight: 10 },
    inputText: { flex: 1, height: '100%', color: '#333', fontSize: 15 },

    saveBtn: {
        flexDirection: 'row',
        backgroundColor: '#f57c00',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 5,
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
        backgroundColor: '#fff3e0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    cardInfo: { flex: 1 },
    cardNome: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 2 },
    cardCnpj: { fontSize: 12, color: '#666' },
    deleteBtn: { padding: 8 },
    emptyText: { textAlign: 'center', color: '#888', marginTop: 20 },
});