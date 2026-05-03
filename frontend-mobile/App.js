import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importação das suas telas externas
import HomeScreen from './src/screens/HomeScreen';
import CategoriaScreen from './src/screens/CategoriaScreen';

const Stack = createNativeStackNavigator();
const API_URL = "http://192.168.1.19:8080/api/usuarios"; // IP atualizado e prefixo /api

// --- TELA DE LOGIN ---
function TelaLogin({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const fazerLogin = async () => {
    if (!email || !senha) {
      Alert.alert("Aviso", "Preencha todos os campos.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const dados = await response.json();

      if (response.ok && dados.token) {
        // SALVAMENTO CRUCIAL: Guarda o crachá para a HomeScreen usar
        await AsyncStorage.setItem('@FluxoInteligente:token', dados.token);
        navigation.replace('HomeScreen');
      } else {
        Alert.alert("Erro", "E-mail ou senha incorretos.");
      }
    } catch (error) {
      Alert.alert("Erro de Conexão", "Não foi possível alcançar o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <View style={styles.container}>
        <Text style={styles.title}>Fluxo Inteligente</Text>
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Senha" value={senha} onChangeText={setSenha} secureTextEntry />

        <TouchableOpacity style={styles.button} onPress={fazerLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>ENTRAR</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('EsqueciSenha')}>
          <Text style={styles.linkText}>Esqueci minha senha</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Cadastro')} style={{ marginTop: 20 }}>
          <Text style={styles.linkText}>Não tem conta? Cadastre-se</Text>
        </TouchableOpacity>
      </View>
  );
}

// --- TELA DE CADASTRO ---
function TelaCadastro({ navigation }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCadastro = async () => {
    if (!nome || !email || !senha || !cnpj) {
      Alert.alert("Erro", "Preencha os campos obrigatórios!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senhaHash: senha, cnpj, telefone })
      });

      if (response.ok) {
        Alert.alert("Sucesso", "Usuário cadastrado!", [{ text: "OK", onPress: () => navigation.navigate('Login') }]);
      } else {
        Alert.alert("Erro", "Falha ao cadastrar. Verifique os dados.");
      }
    } catch (error) {
      Alert.alert("Erro", "Servidor offline.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <View style={styles.container}>
        <Text style={styles.title}>Criar Conta</Text>
        <TextInput style={styles.input} placeholder="Nome Completo" onChangeText={setNome} />
        <TextInput style={styles.input} placeholder="E-mail" onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="CNPJ" onChangeText={setCnpj} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Telefone" onChangeText={setTelefone} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Senha" onChangeText={setSenha} secureTextEntry />

        <TouchableOpacity style={styles.button} onPress={handleCadastro} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>FINALIZAR CADASTRO</Text>}
        </TouchableOpacity>
      </View>
  );
}

// --- TELA ESQUECI SENHA ---
function TelaEsqueciSenha({ navigation }) {
  const [email, setEmail] = useState('');

  const pedirCodigo = async () => {
    try {
      const response = await fetch(`${API_URL}/esqueci-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        Alert.alert("Sucesso!", "Verifique seu e-mail.");
        navigation.navigate('RedefinirSenha', { emailPassado: email });
      } else {
        Alert.alert("Erro", "E-mail não encontrado.");
      }
    } catch (error) {
      Alert.alert("Erro", "Falha na conexão.");
    }
  };

  return (
      <View style={styles.container}>
        <Text style={styles.title}>Recuperar Senha</Text>
        <TextInput style={styles.input} placeholder="Email cadastrado" onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TouchableOpacity style={styles.button} onPress={pedirCodigo}>
          <Text style={styles.buttonText}>ENVIAR CÓDIGO</Text>
        </TouchableOpacity>
      </View>
  );
}

// --- TELA REDEFINIR SENHA ---
function TelaRedefinirSenha({ route, navigation }) {
  const email = route.params?.emailPassado;
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');

  const salvarNovaSenha = async () => {
    try {
      const response = await fetch(`${API_URL}/redefinir-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigo, novaSenha })
      });

      if (response.ok) {
        Alert.alert("Sucesso", "Senha alterada!", [{ text: "OK", onPress: () => navigation.navigate('Login') }]);
      } else {
        Alert.alert("Erro", "Código inválido ou expirado.");
      }
    } catch (error) {
      Alert.alert("Erro", "Falha na conexão.");
    }
  };

  return (
      <View style={styles.container}>
        <Text style={styles.title}>Nova Senha</Text>
        <Text style={{ marginBottom: 15 }}>Enviado para: {email}</Text>
        <TextInput style={styles.input} placeholder="Código" onChangeText={setCodigo} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Nova Senha" onChangeText={setNovaSenha} secureTextEntry />
        <TouchableOpacity style={styles.button} onPress={salvarNovaSenha}>
          <Text style={styles.buttonText}>SALVAR</Text>
        </TouchableOpacity>
      </View>
  );
}

// --- NAVEGAÇÃO PRINCIPAL ---
export default function App() {
  return (
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login">
            <Stack.Screen name="Login" component={TelaLogin} options={{ headerShown: false }} />
            <Stack.Screen name="Cadastro" component={TelaCadastro} options={{ title: 'Criar Conta' }} />
            <Stack.Screen name="EsqueciSenha" component={TelaEsqueciSenha} options={{ title: 'Recuperação' }} />
            <Stack.Screen name="RedefinirSenha" component={TelaRedefinirSenha} options={{ title: 'Nova Senha' }} />

            {/* Telas principais sem o cabeçalho padrão para usar o design personalizado */}
            <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CategoriaScreen" component={CategoriaScreen} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#2e7d32' },
  input: { width: '100%', height: 50, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 15, marginBottom: 15 },
  button: { width: '100%', height: 50, backgroundColor: '#2e7d32', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  linkText: { color: '#2e7d32', fontWeight: 'bold' }
});