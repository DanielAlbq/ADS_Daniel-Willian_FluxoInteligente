import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Markdown from 'react-native-markdown-display';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ChatScreen({ route, navigation }) {
    const insightInicial = route.params?.insightInicial || "Olá! Sou o seu Consultor Financeiro. Como o posso ajudar a analisar as suas finanças hoje?";

    const [messages, setMessages] = useState([
        { id: '1', text: insightInicial, isUser: false }
    ]);

    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef(null);

    const sendMessage = async () => {
        if (!inputText.trim()) return;
        const newUserMsg = { id: Date.now().toString(), text: inputText, isUser: true };
        setMessages(prev => [...prev, newUserMsg]);
        setInputText('');
        setLoading(true);

        try {
            const token = await AsyncStorage.getItem('@FluxoInteligente:token');
            const response = await fetch(`${API_BASE_URL}/insights/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ mensagem: newUserMsg.text })
            });

            if (response.ok) {
                const dados = await response.json();
                const newIaMsg = { id: (Date.now() + 1).toString(), text: dados.resposta, isUser: false };
                setMessages(prev => [...prev, newIaMsg]);
            } else {
                adicionarMensagemErro('Desculpe, ocorreu um erro ao contactar o servidor.');
            }
        } catch (error) {
            console.error("Erro no chat:", error);
            adicionarMensagemErro('Sem ligação. Verifique se o Ngrok e o servidor estão ativos.');
        } finally {
            setLoading(false);
        }
    };

    const adicionarMensagemErro = (textoErro) => {
        setMessages(prev => [...prev, { id: Date.now().toString(), text: textoErro, isUser: false }]);
    };

    const renderMessage = ({ item }) => (
        <View style={[styles.messageBubble, item.isUser ? styles.userBubble : styles.iaBubble]}>
            {item.isUser ? (
                <Text style={styles.userText}>{item.text}</Text>
            ) : (
                <Markdown style={markdownStyles}>
                    {item.text}
                </Markdown>
            )}
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            // Alteramos aqui: usamos 'padding' no iOS e 'height' (ou undefined) no Android
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            // Se usar um cabeçalho fixo, este offset ajuda a não empurrar demasiado
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
        >
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Consultor IA </Text>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.chatContainer}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#2e7d32" />
                    <Text style={styles.loadingText}>A processar...</Text>
                </View>
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Faça uma pergunta sobre o seu caixa..."
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                />
                <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={loading || !inputText.trim()}>
                    <Text style={styles.sendButtonText}>Enviar</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#fff',
        padding: 15,
        paddingTop: 40,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2e7d32',
    },
    chatContainer: {
        padding: 15,
        paddingBottom: 20,
    },
    messageBubble: {
        maxWidth: '85%',
        padding: 12,
        borderRadius: 15,
        marginBottom: 10,
    },
    userBubble: {
        backgroundColor: '#2e7d32',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 0,
    },
    iaBubble: {
        backgroundColor: '#fff',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 0,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    userText: {
        color: '#fff',
        fontSize: 15,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderColor: '#e0e0e0',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingTop: 10,
        paddingBottom: 10,
        marginRight: 10,
    },
    sendButton: {
        backgroundColor: '#2e7d32',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 15,
        justifyContent: 'center',
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        paddingLeft: 20,
    },
    loadingText: {
        marginLeft: 8,
        color: '#666',
        fontSize: 12,
    }
});

const markdownStyles = {
    body: { color: '#333', fontSize: 15, lineHeight: 22 },
    strong: { fontWeight: 'bold', color: '#000' },
};