import React, { useState, useCallback } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    Alert, 
    ActivityIndicator, 
    ScrollView, 
    StatusBar,
    KeyboardAvoidingView, 
    Platform              
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

export default function AjustesScreen({ navigation }) {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState(''); // Email costuma ser apenas leitura
    const [cnpj, setCnpj] = useState('');
    const [telefone, setTelefone] = useState('');
    const [novaSenha, setNovaSenha] = useState('');

    const [loading, setLoading] = useState(true);
    const [salvando, setSalvando] = useState(false);

    const API_URL_USUARIO = `${process.env.EXPO_PUBLIC_API_URL}/usuarios/me`;

    useFocusEffect(
        useCallback(() => {
            carregarPerfil();
        }, [])
    );

    const carregarPerfil = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
            const response = await axios.get(API_URL_USUARIO, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const user = response.data;
            setNome(user.nome || '');
            setEmail(user.email || '');
            setCnpj(user.cnpj || '');
            setTelefone(user.telefone || '');
        } catch (error) {
            console.error("Erro ao carregar perfil:", error);
            Alert.alert("Erro", "Não foi possível carregar os dados do seu perfil.");
        } finally {
            setLoading(false);
        }
    };

    const salvarAlteracoes = async () => {
        if (!nome) {
            Alert.alert("Aviso", "O campo Nome é obrigatório.");
            return;
        }

        setSalvando(true);
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
            
            const payload = {
                nome,
                cnpj,
                telefone,
                senhaHash: novaSenha ? novaSenha : null // Só envia se preenchido
            };

            const response = await axios.put(API_URL_USUARIO, payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 200) {
                // Atualiza o nome salvo localmente caso tenha mudado
                await AsyncStorage.setItem('@FluxoInteligente:nomeUsuario', response.data.nome);
                Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
                setNovaSenha(''); // Limpa o campo de senha
            }
        } catch (error) {
            console.error("Erro ao salvar perfil:", error);
            Alert.alert("Erro", "Não foi possível atualizar o perfil.");
        } finally {
            setSalvando(false);
        }
    };

    const handleExcluirConta = () => {
        Alert.alert(
            "⚠️ EXCLUIR CONTA DEFINITIVAMENTE?",
            "Esta ação é IRREVERSÍVEL. Todos os seus dados, categorias, fornecedores e lançamentos financeiros serão apagados permanentemente dos nossos servidores em conformidade com a LGPD.",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Sim, Excluir Tudo", 
                    style: "destructive",
                    onPress: executarExclusaoConta
                }
            ]
        );
    };

    const executarExclusaoConta = async () => {
        setSalvando(true);
        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
            const response = await axios.delete(API_URL_USUARIO, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 204 || response.status === 200) {
                // Limpa completamente a sessão do app
                await AsyncStorage.clear();
                Alert.alert("Conta Excluída", "Seus dados foram completamente removidos. Esperamos ver você de volta em breve!");
                
                // Reseta a navegação para a tela de Login
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
            }
        } catch (error) {
            console.error("Erro ao deletar conta:", error);
            Alert.alert("Erro", "Não foi possível excluir a sua conta. Tente novamente mais tarde.");
        } finally {
            setSalvando(false);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.clear();
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#546e7a" />
                <Text style={{ marginTop: 10, color: '#666' }}>Carregando configurações...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Configurações & Ajustes</Text>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Ionicons name="log-out-outline" size={24} color="#d32f2f" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView 
                    showsVerticalScrollIndicator={false} 
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.sectionLabel}>Dados Cadastrais (Retificação)</Text>
                    
                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color="#546e7a" style={styles.inputIcon} />
                        <TextInput
                            style={styles.inputText}
                            placeholder="Seu Nome Completo"
                            value={nome}
                            onChangeText={setNome}
                        />
                    </View>

                    {/* Campo de email desabilitado para edição por segurança (boa prática) */}
                    <View style={[styles.inputContainer, { backgroundColor: '#eceff1' }]}>
                        <Ionicons name="mail-outline" size={20} color="#90a4ae" style={styles.inputIcon} />
                        <TextInput
                            style={[styles.inputText, { color: '#78909c' }]}
                            value={email}
                            editable={false}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="business-outline" size={20} color="#546e7a" style={styles.inputIcon} />
                        <TextInput
                            style={styles.inputText}
                            placeholder="CNPJ da Empresa"
                            keyboardType="numeric"
                            value={cnpj}
                            onChangeText={setCnpj}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="call-outline" size={20} color="#546e7a" style={styles.inputIcon} />
                        <TextInput
                            style={styles.inputText}
                            placeholder="Telefone de Contato"
                            keyboardType="phone-pad"
                            value={telefone}
                            onChangeText={setTelefone}
                        />
                    </View>

                    <Text style={styles.sectionLabel}>Segurança</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#546e7a" style={styles.inputIcon} />
                        <TextInput
                            style={styles.inputText}
                            placeholder="Nova Senha (deixe em branco para manter)"
                            secureTextEntry={true}
                            value={novaSenha}
                            onChangeText={setNovaSenha}
                        />
                    </View>

                    <TouchableOpacity style={styles.saveButton} onPress={salvarAlteracoes} disabled={salvando} activeOpacity={0.8}>
                        {salvando ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="save-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.saveButtonText}>SALVAR ALTERAÇÕES</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.sectionLabelLGPD}>Privacidade & LGPD</Text>
                    <Text style={styles.lgpdInfoText}>
                        Sob as diretrizes da Lei Geral de Proteção de Dados (Lei nº 13.709), você possui o direito de revogar seu consentimento e solicitar a eliminação definitiva de sua conta a qualquer momento.
                    </Text>

                    <TouchableOpacity style={styles.deleteAccountButton} onPress={handleExcluirConta} disabled={salvando} activeOpacity={0.8}>
                        <Ionicons name="trash-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.deleteAccountButtonText}>EXCLUIR MINHA CONTA</Text>
                    </TouchableOpacity>

                </ScrollView>
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
        backgroundColor: '#cfd8dc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoutButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ffebee',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 10 },
    sectionLabel: { fontSize: 14, fontWeight: '600', color: '#546e7a', marginBottom: 10, marginTop: 15 },
    sectionLabelLGPD: { fontSize: 14, fontWeight: '600', color: '#d32f2f', marginBottom: 5, marginTop: 30 },
    lgpdInfoText: { fontSize: 12, color: '#78909c', marginBottom: 15, lineHeight: 18, textAlign: 'justify' },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 15,
        paddingHorizontal: 15,
        height: 55,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    inputIcon: { marginRight: 10 },
    inputText: { flex: 1, height: '100%', color: '#333', fontSize: 16 },
    saveButton: { 
        flexDirection: 'row',
        backgroundColor: '#546e7a', 
        height: 55, 
        borderRadius: 12, 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginTop: 10,
        elevation: 2,
    },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    deleteAccountButton: {
        flexDirection: 'row',
        backgroundColor: '#d32f2f',
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 5,
    },
    deleteAccountButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }
});