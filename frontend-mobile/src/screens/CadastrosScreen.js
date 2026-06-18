import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function CadastrosScreen({ navigation }) {
    
    // Componente reutilizável para os botões do menu
    const MenuCard = ({ title, description, icon, color, onPress }) => (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={28} color={color} />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardDescription}>{description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
            
            {/* CABEÇALHO */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cadastros</Text>
                {/* Espaçador para manter o título perfeitamente centralizado */}
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.sectionLabel}>O que deseja gerenciar hoje?</Text>

                {/* CARTÃO DE CATEGORIAS */}
                <MenuCard
                    title="Categorias"
                    description="Crie, edite ou remova as categorias de receitas e despesas."
                    icon="pricetags-outline"
                    color="#1976d2" // Azul
                    onPress={() => navigation.navigate('CategoriaScreen')}
                />

                {/* CARTÃO DE FORNECEDORES */}
                <MenuCard
                    title="Fornecedores"
                    description="Mantenha o controle e os dados das empresas parceiras e prestadores."
                    icon="business-outline"
                    color="#f57c00" // Laranja
                    onPress={() => navigation.navigate('FornecedorScreen')}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f8f9fa' 
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e0e0e0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: '#333' 
    },
    content: { 
        paddingHorizontal: 20, 
        paddingTop: 10 
    },
    sectionLabel: { 
        fontSize: 14, 
        fontWeight: '600', 
        color: '#555', 
        marginBottom: 20 
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    textContainer: { 
        flex: 1, 
        paddingRight: 10 
    },
    cardTitle: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: '#333', 
        marginBottom: 4 
    },
    cardDescription: { 
        fontSize: 13, 
        color: '#777', 
        lineHeight: 18 
    }
});