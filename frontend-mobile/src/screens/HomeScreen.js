import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { PieChart } from "react-native-gifted-charts";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient'; // <-- Novo import para o degradê

const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
  const [saldo, setSaldo] = useState(0);
  const [receitas, setReceitas] = useState(0);
  const [despesas, setDespesas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dadosGrafico, setDadosGrafico] = useState([]);
  const [nomeUsuario, setNomeUsuario] = useState("Empreendedor");

  // Novo estado para controlar se os saldos estão visíveis ou ocultos
  const [saldosVisiveis, setSaldosVisiveis] = useState(true);

  const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/lancamentos/saldo`;

  useFocusEffect(
    useCallback(() => {
      carregarDadosDashboard();
    }, [])
  );

  const carregarDadosDashboard = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("@FluxoInteligente:token");

      if (!token) {
        navigation.replace("Login");
        return;
      }

      // Busca o nome
      const nomeSalvo = await AsyncStorage.getItem("@FluxoInteligente:nome");
      if (nomeSalvo) {
        const primeiroNome = nomeSalvo.split(' ')[0];
        setNomeUsuario(primeiroNome);
      }

      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (typeof response.data === "object" && response.data !== null) {
        setSaldo(response.data.saldo || 0);
        setReceitas(response.data.receitas || 0);
        setDespesas(response.data.despesas || 0);
      } else {
        setSaldo(response.data || 0);
      }

      const hoje = new Date();
      const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

      const formatarDataAPI = (data) => {
        const year = data.getFullYear();
        const month = String(data.getMonth() + 1).padStart(2, "0");
        const day = String(data.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const dataInicioFormatada = formatarDataAPI(primeiroDia);
      const dataFimFormatada = formatarDataAPI(ultimoDia);

      const responseGrafico = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/lancamentos/filtrar?dataInicio=${dataInicioFormatada}&dataFim=${dataFimFormatada}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const transacoesDoMes = responseGrafico.data;

      const coresReceita = ["#66bb6a", "#81c784", "#aed581", "#4db6ac"];
      const coresDespesa = ["#ef5350", "#e57373", "#ffb74d", "#ff8a65", "#ba68c8"];

      let recIndex = 0;
      let despIndex = 0;
      const grupos = {};

      transacoesDoMes.forEach((lancamento) => {
        const nomeCategoria = lancamento.categoria?.nome || "Outros";
        const isReceita = lancamento.tipo === "RECEITA";
        const chave = `${nomeCategoria}-${lancamento.tipo}`;

        if (!grupos[chave]) {
          grupos[chave] = {
            value: 0,
            text: nomeCategoria,
            tipo: lancamento.tipo,
            color: isReceita
              ? coresReceita[recIndex++ % coresReceita.length]
              : coresDespesa[despIndex++ % coresDespesa.length],
          };
        }
        grupos[chave].value += lancamento.valor;
      });

      setDadosGrafico(Object.values(grupos));
    } catch (error) {
      if (error.response && (error.response.status === 403 || error.response.status === 401)) {
        await AsyncStorage.removeItem("@FluxoInteligente:token");
        navigation.replace("Login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Sair", "Deseja realmente sair da aplicação?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("@FluxoInteligente:token");
          navigation.replace("Login");
        },
      },
    ]);
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  // Função auxiliar para ocultar valores se o olhinho estiver fechado
  const renderizarValor = (valor) => {
    return saldosVisiveis ? formatarMoeda(valor) : "R$ •••••";
  };

  const FeatureCard = ({ title, icon, color, onPress }) => (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.cardIconContainer, { backgroundColor: color }]}>
        <Ionicons name={icon} size={28} color="#fff" />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* CABEÇALHO */}
        <View style={styles.header}>
          <View>
            {/* NOVO: Usando a variável nomeUsuario */}
            <Text style={styles.greeting}>Olá, {nomeUsuario}!</Text>
            <Text style={styles.subGreeting}>Bem-vindo ao Fluxo Inteligente</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={26} color="#d32f2f" />
          </TouchableOpacity>
        </View>

        {/* CARD PRINCIPAL (AGORA COM GRADIENTE E BOTÃO DE OCULTAR) */}
        <LinearGradient
          colors={['#1b5e20', '#4caf50']} // Gradiente do Verde Escuro para o Verde Médio
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.dashboardCard}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabel}>Saldo em Caixa</Text>
            <TouchableOpacity onPress={() => setSaldosVisiveis(!saldosVisiveis)}>
              <Ionicons
                name={saldosVisiveis ? "eye-outline" : "eye-off-outline"}
                size={22}
                color="#c8e6c9"
              />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="#fff" style={{ marginVertical: 10 }} />
          ) : (
            <Text style={styles.balanceValue}>{renderizarValor(saldo)}</Text>
          )}

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statItem}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate("ExtratoScreen", {
                  tipoFiltro: "RECEITA",
                  mesFiltro: new Date().getMonth() + 1,
                  anoFiltro: new Date().getFullYear(),
                })
              }
            >
              <View style={styles.statHeader}>
                <Ionicons name="arrow-up-circle" size={16} color="#a5d6a7" />
                <Text style={styles.statLabel}>Receitas</Text>
              </View>
              <Text style={[styles.statValue, { color: "#a5d6a7" }]}>
                {saldosVisiveis ? `+ ${formatarMoeda(receitas)}` : "•••••"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statItem}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate("ExtratoScreen", {
                  tipoFiltro: "DESPESA",
                  mesFiltro: new Date().getMonth() + 1,
                  anoFiltro: new Date().getFullYear(),
                })
              }
            >
              <View style={styles.statHeader}>
                <Ionicons name="arrow-down-circle" size={16} color="#ef9a9a" />
                <Text style={styles.statLabel}>Despesas</Text>
              </View>
              <Text style={[styles.statValue, { color: "#ef9a9a" }]}>
                {saldosVisiveis ? `- ${formatarMoeda(despesas)}` : "•••••"}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* GRÁFICO DE MOVIMENTAÇÕES (AGORA COM LEGENDA EM CHIPS) */}
        {dadosGrafico.length > 0 && !loading && (
          <View style={styles.graficoContainer}>
            <Text style={styles.graficoTitulo}>Movimentações do Mês</Text>
            <View style={styles.graficoWrapper}>
              <PieChart
                donut
                innerRadius={55}
                radius={85}
                data={dadosGrafico}
                centerLabelComponent={() => (
                  <View style={{ justifyContent: "center", alignItems: "center" }}>
                    <Text
                      style={{
                        fontSize: 16,
                        color: saldo >= 0 ? "#2e7d32" : "#e53935",
                        fontWeight: "bold",
                      }}
                    >
                      {saldosVisiveis ? formatarMoeda(saldo).replace("R$", "").trim() : "•••"}
                    </Text>
                    <Text style={{ fontSize: 10, color: "#666" }}>Saldo</Text>
                  </View>
                )}
              />

              {/* NOVA LEGENDA ESTILO CHIPS */}
              <View style={styles.legendaContainer}>
                {dadosGrafico.map((item, index) => (
                  <View key={index} style={styles.legendaChip}>
                    <View style={[styles.legendaCor, { backgroundColor: item.color }]} />
                    <Text style={styles.legendaTexto}>
                      {item.text}
                    </Text>
                    <Text style={[styles.legendaValor, { color: item.tipo === "RECEITA" ? "#2e7d32" : "#c62828" }]}>
                      {item.tipo === "RECEITA" ? "+" : "-"} {saldosVisiveis ? formatarMoeda(item.value).replace("R$", "").trim() : "•••"}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* MENU DE FUNCIONALIDADES */}
        <Text style={styles.sectionTitle}>Funcionalidades</Text>
        <View style={styles.menuGrid}>
          <FeatureCard
            title="Lançamento"
            icon="swap-horizontal-outline"
            color="#2e7d32"
            onPress={() => navigation.navigate("LancamentoScreen")}
          />
          <FeatureCard
            title="Extrato"
            icon="receipt-outline"
            color="#1976d2"
            onPress={() => navigation.navigate("ExtratoScreen")}
          />
          <FeatureCard
            title="Ler Nota OCR"
            icon="camera-outline"
            color="#f57c00"
            onPress={() => navigation.navigate("LancamentoOcrScreen")}
          />
          <FeatureCard
            title="Cadastros"
            icon="folder-open-outline"
            color="#8e24aa"
            onPress={() => navigation.navigate("CadastrosScreen")}

          />
          <FeatureCard
            title="Insights IA"
            icon="hardware-chip-outline"
            color="#00897b"
            onPress={() => navigation.navigate("InsightsScreen")}
          />
          <FeatureCard
            title="Ajustes"
            icon="settings-outline"
            color="#546e7a"

          />
          style={styles.menuItem}
          onPress={() => Alert.alert("Funcionalidade", "Definições do App")}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: "bold", color: "#2e7d32" },
  subGreeting: { fontSize: 14, color: "#666" },
  logoutButton: {
    padding: 8,
    backgroundColor: "#ffebee",
    borderRadius: 12,
  },
  dashboardCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: { color: "#c8e6c9", fontSize: 14 },
  balanceValue: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginVertical: 5,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 15,
  },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  statItem: { flex: 1 },
  statHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  statLabel: { color: "#c8e6c9", fontSize: 12, marginLeft: 4 },
  statValue: { fontSize: 16, fontWeight: "bold" },
  graficoContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  graficoTitulo: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  graficoWrapper: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  // NOVOS ESTILOS PARA AS LEGENDAS EM CHIP
  legendaContainer: {
    marginTop: 20,
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10, // Espaçamento entre os chips (suportado nas versões mais novas do RN)
  },
  legendaChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    margin: 4, // Margem como fallback caso o 'gap' não aplique perfeitamente
  },
  legendaCor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendaTexto: {
    fontSize: 12,
    color: "#555",
    marginRight: 4,
  },
  legendaValor: {
    fontSize: 12,
    fontWeight: "bold",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 15,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: "#fff",
    width: (width - 60) / 2,
    aspectRatio: 1,
    borderRadius: 16,
    padding: 15,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    textAlign: "center",
  },
});