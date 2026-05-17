import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function CadastrosScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Cadastre</Text>

            <View style={styles.tipoContainer}>
                <TouchableOpacity
                    style={[styles.tipoButton, styles.tipoFornecedor]}
                    onPress={() => navigation.navigate('FornecedorScreen')}
                >
                    <Text style={styles.tipoText}>🚚 Fornecedores</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tipoButton, styles.tipoCategoria]}
                    onPress={() => navigation.navigate('CategoriaScreen')}
                >
                    <Text style={styles.tipoText}>📁 Categorias de gasto</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa', justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 40, textAlign: 'center' },
    tipoContainer: { flexDirection: 'column', gap: 20 },
    tipoButton: { padding: 20, borderRadius: 8, alignItems: 'center', justifyContent: 'center', elevation: 2, marginBottom: 20 },
    tipoFornecedor: { backgroundColor: '#e3f2fd', borderWidth: 1, borderColor: '#2196f3' },
    tipoCategoria: { backgroundColor: '#fff3e0', borderWidth: 1, borderColor: '#ff9800' },
    tipoText: { fontSize: 18, fontWeight: 'bold', color: '#333' }
});