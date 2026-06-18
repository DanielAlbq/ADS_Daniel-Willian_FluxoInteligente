import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons'; // Importando ícones profissionais

import HomeScreen from './src/screens/HomeScreen';
import CategoriaScreen from './src/screens/CategoriaScreen';
import LancamentoScreen from './src/screens/LancamentoScreen';
import ReceitaScreen from './src/screens/ReceitaScreen';
import DespesaScreen from './src/screens/DespesaScreen';
import CadastrosScreen from './src/screens/CadastrosScreen';
import FornecedorScreen from './src/screens/FornecedorScreen';
import LancamentoOcrScreen from './src/screens/LancamentoOcrScreen';
import ExtratoScreen from './src/screens/ExtratoScreen';
import InsightsScreen from './src/screens/InsightsScreen';

const Stack = createNativeStackNavigator();
const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/usuarios`;

// --- COMPONENTES DE DESIGN SYSTEM ---
const CustomInput = ({ icon, ...props }) => (
  <View style={styles.inputContainer}>
    <Ionicons name={icon} size={20} color="#2e7d32" style={styles.inputIcon} />
    <TextInput 
      style={styles.inputText} 
      placeholderTextColor="#888" 
      {...props} 
    />
  </View>
);

const CustomButton = ({ title, onPress, loading }) => (
  <TouchableOpacity style={styles.primaryButton} onPress={onPress} disabled={loading}>
    {loading ? (
      <ActivityIndicator color="#fff" />
    ) : (
      <Text style={styles.buttonText}>{title}</Text>
    )}
  </TouchableOpacity>
);

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

      if (response.ok) {
        const dados = await response.json();
        if (dados.token) {
          await AsyncStorage.setItem('@FluxoInteligente:token', dados.token);
          // SALVA O NOME
          const nomeParaSalvar = dados.nome || dados.usuario?.nome || "Empreendedor";
          await AsyncStorage.setItem('@FluxoInteligente:nome', nomeParaSalvar);

          navigation.replace('HomeScreen');
        }
      } else if (response.status === 401 || response.status === 403) {
        Alert.alert("Acesso Negado", "E-mail ou senha incorretos.");
      } else {
        Alert.alert("Erro", "Ocorreu um problema ao tentar conectar.");
      }
    } catch (error) {
      Alert.alert("Erro de Conexão", "Não foi possível alcançar o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.headerContainer}>
        <Ionicons name="leaf" size={60} color="#2e7d32" />
        <Text style={styles.title}>Fluxo Inteligente</Text>
        <Text style={styles.subtitle}>Gestão financeira simples e eficaz</Text>
      </View>

      <View style={styles.formContainer}>
        <CustomInput icon="mail-outline" placeholder="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <CustomInput icon="lock-closed-outline" placeholder="Senha" value={senha} onChangeText={setSenha} secureTextEntry />

        <TouchableOpacity onPress={() => navigation.navigate('EsqueciSenha')} style={styles.forgotPassword}>
          <Text style={styles.linkText}>Esqueci minha senha</Text>
        </TouchableOpacity>

        <CustomButton title="ENTRAR" onPress={fazerLogin} loading={loading} />

        <View style={styles.registerContainer}>
          <Text style={styles.textNormal}>Não tem conta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
            <Text style={[styles.linkText, { fontWeight: 'bold' }]}>Cadastre-se</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.titleSmall}>Crie sua conta</Text>
      <Text style={styles.subtitle}>Preencha os dados abaixo para começar</Text>

      <View style={[styles.formContainer, { marginTop: 20 }]}>
        <CustomInput icon="person-outline" placeholder="Nome Completo" onChangeText={setNome} />
        <CustomInput icon="mail-outline" placeholder="E-mail" onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <CustomInput icon="business-outline" placeholder="CNPJ" onChangeText={setCnpj} keyboardType="numeric" />
        <CustomInput icon="call-outline" placeholder="Telefone" onChangeText={setTelefone} keyboardType="phone-pad" />
        <CustomInput icon="lock-closed-outline" placeholder="Senha" onChangeText={setSenha} secureTextEntry />

        <CustomButton title="FINALIZAR CADASTRO" onPress={handleCadastro} loading={loading} />
      </View>
    </ScrollView>
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
    <View style={[styles.container, { justifyContent: 'flex-start', paddingTop: 50 }]}>
      <Ionicons name="key-outline" size={50} color="#2e7d32" style={{ alignSelf: 'center', marginBottom: 20 }} />
      <Text style={styles.titleSmall}>Recuperar Senha</Text>
      <Text style={[styles.subtitle, { textAlign: 'center', marginBottom: 30 }]}>Digite o e-mail cadastrado para receber o código de recuperação.</Text>
      
      <View style={styles.formContainer}>
        <CustomInput icon="mail-outline" placeholder="Email cadastrado" onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <CustomButton title="ENVIAR CÓDIGO" onPress={pedirCodigo} />
      </View>
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
    <View style={[styles.container, { justifyContent: 'flex-start', paddingTop: 50 }]}>
      <Text style={styles.titleSmall}>Nova Senha</Text>
      <Text style={[styles.subtitle, { textAlign: 'center', marginBottom: 20 }]}>Enviado para: {email}</Text>
      
      <View style={styles.formContainer}>
        <CustomInput icon="apps-outline" placeholder="Código numérico" onChangeText={setCodigo} keyboardType="numeric" />
        <CustomInput icon="lock-closed-outline" placeholder="Nova Senha" onChangeText={setNovaSenha} secureTextEntry />
        <CustomButton title="SALVAR NOVA SENHA" onPress={salvarNovaSenha} />
      </View>
    </View>
  );
}

// --- NAVEGAÇÃO PRINCIPAL ---
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{
            headerStyle: { backgroundColor: '#fff' },
            headerTintColor: '#2e7d32',
            headerTitleStyle: { fontWeight: 'bold' },
            headerShadowVisible: false, // Remove a linha embaixo do cabeçalho
          }}
        >
          <Stack.Screen name="Login" component={TelaLogin} options={{ headerShown: false }} />
          <Stack.Screen name="Cadastro" component={TelaCadastro} options={{ title: '' }} />
          <Stack.Screen name="EsqueciSenha" component={TelaEsqueciSenha} options={{ title: '' }} />
          <Stack.Screen name="RedefinirSenha" component={TelaRedefinirSenha} options={{ title: '' }} />

          {/* Telas principais */}
          <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CategoriaScreen" component={CategoriaScreen} options={{ headerShown: false }} />
          <Stack.Screen name="LancamentoScreen" component={LancamentoScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ExtratoScreen" component={ExtratoScreen} options={{ headerShown: false }} />
          <Stack.Screen name="FornecedorScreen" component={FornecedorScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CadastrosScreen" component={CadastrosScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ReceitaScreen" component={ReceitaScreen} options={{ headerShown: false }} />
          <Stack.Screen name="DespesaScreen" component={DespesaScreen} options={{ headerShown: false }} />
          <Stack.Screen name="LancamentoOcrScreen" component={LancamentoOcrScreen} options={{ title: 'Escanear Nota' }} />
          <Stack.Screen name="InsightsScreen" component={InsightsScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// --- ESTILOS GLOBAIS (DESIGN SYSTEM) ---
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#2e7d32',
    marginTop: 10,
  },
  titleSmall: {
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#2e7d32',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  formContainer: {
    width: '100%',
  },
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
  inputIcon: {
    marginRight: 10,
  },
  inputText: {
    flex: 1,
    height: '100%',
    color: '#333',
    fontSize: 16,
  },
  primaryButton: { 
    width: '100%', 
    height: 55, 
    backgroundColor: '#2e7d32', 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 10,
    elevation: 2, // Sombra no Android
    shadowColor: '#000', // Sombra no iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  linkText: { 
    color: '#2e7d32', 
    fontSize: 14,
  },
  textNormal: {
    color: '#666',
    fontSize: 14,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  }
}); 