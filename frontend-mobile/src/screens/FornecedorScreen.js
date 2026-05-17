import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FornecedorScreen() {
    const [fornecedores, setFornecedores] = useState([]);
    const [nome, setNome] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [telefone, setTelefone] = useState('');
    const [loading, setLoading] = useState(false);

    const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/fornecedores`;

    useEffect(() => {
        buscarFornecedores();
    }, []);

    const buscarFornecedores = async () => {
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
            const response = await fetch(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const dados = await response.json();
                setFornecedores(dados);
            }
        } catch (error) {
            console.error("Erro ao buscar fornecedores:", error);
        }
    };

    const salvarFornecedor = async () => {
        // Validação básica para garantir que os campos obrigatórios sejam preenchidos
        if (!nome || !cnpj) {
            Alert.alert("Aviso", "Os campos Nome e CNPJ são obrigatórios.");
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
                // Incluindo o CNPJ no envio dos dados
                body: JSON.stringify({ nome, cnpj, telefone })
            });

            if (response.status === 201 || response.ok) {
                Alert.alert("Sucesso", "Fornecedor cadastrado!");
                setNome('');
                setCnpj(''); // Limpa o campo de CNPJ
                setTelefone('');
                buscarFornecedores();
            } else {
                Alert.alert("Erro", "Não foi possível cadastrar o fornecedor.");
            }
        } catch (error) {
            Alert.alert("Erro", "Falha de conexão com o servidor.");
        } finally {
            setLoading(false);
        }
    };

    const deletarFornecedor = async (id) => {
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 204 || response.ok) {
                Alert.alert("Sucesso", "Fornecedor excluído!");
                buscarFornecedores();
            } else {
                Alert.alert("Erro", "Não foi possível excluir o fornecedor.");
            }
        } catch (error) {
            Alert.alert("Erro", "Falha de conexão com o servidor.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Meus Fornecedores</Text>

            <View style={styles.formCard}>
                <TextInput
                    style={styles.input}
                    placeholder="Nome do Fornecedor"
                    value={nome}
                    onChangeText={setNome}
                />

                {/* Novo Input para CNPJ */}
                <TextInput
                    style={styles.input}
                    placeholder="CNPJ (Somente números)"
                    value={cnpj}
                    onChangeText={setCnpj}
                    keyboardType="numeric"
                    maxLength={14} // Limita a 14 caracteres numéricos
                />

                <TextInput
                    style={styles.input}
                    placeholder="Telefone / Contato"
                    value={telefone}
                    onChangeText={setTelefone}
                    keyboardType="phone-pad"
                />
                <TouchableOpacity style={styles.button} onPress={salvarFornecedor} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>ADICIONAR FORNECEDOR</Text>
                    )}
                </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>Fornecedores Cadastrados</Text>

            <FlatList
                data={fornecedores}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.itemLista}>
                        <View style={styles.itemInfo}>
                            <Text style={styles.itemNome}>{item.nome}</Text>
                            {/* Exibindo o CNPJ e o Telefone na listagem */}
                            <Text style={styles.itemDescricao}>CNPJ: {item.cnpj}</Text>
                            <Text style={styles.itemDescricao}>Tel: {item.telefone || 'N/A'}</Text>
                        </View>
                        <TouchableOpacity style={styles.deleteButton} onPress={() => deletarFornecedor(item.id)}>
                            <Text style={styles.deleteIcon}>🗑</Text>
                        </TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>Nenhum fornecedor cadastrado.</Text>}
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
    itemLista: { padding: 15, backgroundColor: '#fff', marginBottom: 10, borderRadius: 8, borderLeftWidth: 5, borderLeftColor: '#2e7d32', elevation: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    itemInfo: { flex: 1 },
    itemNome: { fontSize: 16, fontWeight: 'bold' },
    itemDescricao: { fontSize: 14, color: '#666', marginTop: 4 },
    emptyText: { textAlign: 'center', color: '#999', marginTop: 20 },
    deleteButton: { padding: 10, justifyContent: 'center', alignItems: 'center' },
    deleteIcon: { fontSize: 24, fontWeight: 'bold', color: '#d32f2f' }
});