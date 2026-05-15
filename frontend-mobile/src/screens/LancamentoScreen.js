import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function LancamentoScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Novo Lançamento</Text>

            <View style={styles.tipoContainer}>
                <TouchableOpacity
                    style={[styles.tipoButton, styles.tipoReceita]}
                    onPress={() => navigation.navigate('ReceitaScreen')}
                >
                    <Text style={styles.tipoText}>⬆️ NOVA RECEITA</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tipoButton, styles.tipoDespesa]}
                    onPress={() => navigation.navigate('DespesaScreen')}
                >
                    <Text style={styles.tipoText}>⬇️ NOVA DESPESA</Text>
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
    tipoReceita: { backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: '#4caf50' },
    tipoDespesa: { backgroundColor: '#ffebee', borderWidth: 1, borderColor: '#f44336' },
    tipoText: { fontSize: 18, fontWeight: 'bold', color: '#333' }
});