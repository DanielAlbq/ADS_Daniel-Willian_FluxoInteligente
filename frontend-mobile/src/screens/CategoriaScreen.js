import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';

export default function CategoriaScreen() {
    const [categorias, setCategorias] = useState([]);
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [loading, setLoading] = useState(false);

    const API_URL = "http://172.30.49.184:8080/api/categorias";
    // setar o usuario para teste
    const idUsuario = "f5faf5ca-9349-42a1-9758-fef0a8c2469e";

    useEffect(() => {
        buscarCategorias();
    }, []);

    const buscarCategorias = async () => {
        try {
            const response = await fetch(`${API_URL}/usuario/${idUsuario}`);
            if (response.ok) {
                const dados = await response.json();
                setCategorias(dados);
            }
        } catch (error) {
            console.error("Erro ao buscar categorias:", error);
        }
    };

    const salvarCategoria = async () => {
        if (!nome) {
            Alert.alert("Aviso", "O nome da categoria é obrigatório.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome,
                    descricao,
                    usuario: { idUsuario: idUsuario }
                })
            });

            if (response.ok) {
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

            {/* Formulário de Criação */}
            <View style={styles.formCard}>
                <TextInput
                    style={styles.input}
                    placeholder="Nome (ex: Alimentação)"
                    value={nome}
                    onChangeText={setNome}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Descrição (opcional)"
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

            {/* Lista de Categorias */}
            <FlatList
                data={categorias}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.itemLista}>
                        <Text style={styles.itemNome}>{item.nome}</Text>
                        {item.descricao ? <Text style={styles.itemDescricao}>{item.descricao}</Text> : null}
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