import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';

const Stack = createNativeStackNavigator();
const API_URL = "http://192.168.3.17:8080/usuarios";

function TelaLogin({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const fazerLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      if (response.ok) {
        Alert.alert("Sucesso", "Você entrou no aplicativo!",
          [
            { text: 'OK', onPress: () => navigation.navigate('HomeScreen') }
          ]
        );
      } else {
        Alert.alert("Acesso Negado", "E-mail ou senha incorretos.");
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao conectar com o servidor.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fluxo Inteligente</Text>
      <TextInput style={styles.input} placeholder="Email" onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Senha" onChangeText={setSenha} secureTextEntry />

      <TouchableOpacity style={styles.button} onPress={fazerLogin}>
        <Text style={styles.buttonText}>ENTRAR</Text>
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


// tela de esqueci senha
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
        // Navega para a tela de digitar o código, passando o e-mail junto!
        navigation.navigate('RedefinirSenha', { emailPassado: email });
      } else {
        Alert.alert("Erro", "Não foi possível solicitar o código.");
      }
    } catch (error) {
      Alert.alert("Erro de Conexão", "Servidor offline.");
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

// tela de redefinir senha
function TelaRedefinirSenha({ route, navigation }) {
  // Pega o e-mail que veio da tela anterior
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
        Alert.alert("Sucesso", "Sua senha foi alterada!");
        navigation.navigate('Login'); // Manda de volta pro login
      } else {
        const erro = await response.text();
        Alert.alert("Erro", erro); // Vai mostrar se o código é inválido ou expirou
      }
    } catch (error) {
      Alert.alert("Erro", "Falha de conexão.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar Nova Senha</Text>
      <Text style={{ marginBottom: 20 }}>Enviamos um código para: {email}</Text>

      <TextInput style={styles.input} placeholder="Código de 6 dígitos" onChangeText={setCodigo} keyboardType="numeric" maxLength={6} />
      <TextInput style={styles.input} placeholder="Nova Senha" onChangeText={setNovaSenha} secureTextEntry />

      <TouchableOpacity style={styles.button} onPress={salvarNovaSenha}>
        <Text style={styles.buttonText}>SALVAR NOVA SENHA</Text>
      </TouchableOpacity>
    </View>
  );
}

// tela de cadastro
function TelaCadastro({ navigation }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [telefone, setTelefone] = useState('');

  // ver/desver senha
  const [verSenha, setVerSenha] = useState(true);

  const handleCadastro = async () => {
    if (!nome || !email || !senha || !cnpj) {
      Alert.alert("Erro", "Preencha os campos obrigatórios!");
      return;
    }

    try {
      const response = await fetch(`${API_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          email,
          senhaHash: senha,
          cnpj,
          telefone
        })
      });

      if (response.ok) {
        Alert.alert("Sucesso", "Usuário cadastrado!");
        navigation.navigate('Login'); // redirecionar para o login apos cadastrar
      } else {
        Alert.alert("Erro", "Falha ao cadastrar usuário.");
      }
    } catch (error) {
      Alert.alert("Erro de Conexão", "Verifique se o Back-end está rodando.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar Nova Conta</Text>

      <TextInput style={styles.input} placeholder="Nome Completo" onChangeText={setNome} />
      <TextInput style={styles.input} placeholder="E-mail" onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="CNPJ" onChangeText={setCnpj} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Telefone" onChangeText={setTelefone} keyboardType="phone-pad" />
      <View style={styles.caixaSenha}>
        <TextInput
          style={styles.inputSenha}
          placeholder="Senha"
          onChangeText={setSenha}
          secureTextEntry={verSenha}
        />
        <TouchableOpacity onPress={() => setVerSenha(!verSenha)}>
          <Text style={{ fontSize: 20 }}>{verSenha ? "🙉" : "🙈"}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleCadastro}>
        <Text style={styles.buttonText}>FINALIZAR CADASTRO</Text>
      </TouchableOpacity>
    </View>
  );
}

// rotas para as telas

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={TelaLogin} options={{ headerShown: false }} />
          <Stack.Screen name="Cadastro" component={TelaCadastro} options={{ title: 'Criar Conta' }} />
          <Stack.Screen name="EsqueciSenha" component={TelaEsqueciSenha} options={{ title: 'Recuperação' }} />
          <Stack.Screen name="RedefinirSenha" component={TelaRedefinirSenha} options={{ title: 'Nova Senha' }} />
          <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ title: "headerShown: false" }} />
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
  linkText: { color: '#2e7d32', fontWeight: 'bold' },
  caixaSenha: {
    flexDirection: 'row',
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  inputSenha: {
    flex: 1,
    height: '100%',
  }
});