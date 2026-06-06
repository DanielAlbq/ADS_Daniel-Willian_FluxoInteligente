import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function ExtratoScreen({ route, navigation }) {
  // 1. Lendo parâmetros enviados pela HomeScreen
  const params = route.params || {};

  // Se vieram parâmetros do Dashboard, calculamos o primeiro e último dia desse mês
  const initialDateStart =
    params.mesFiltro && params.anoFiltro
      ? new Date(params.anoFiltro, params.mesFiltro - 1, 1)
      : new Date(new Date().setDate(1));

  const initialDateEnd =
    params.mesFiltro && params.anoFiltro
      ? new Date(params.anoFiltro, params.mesFiltro, 0)
      : new Date();

  // 2. Inicializando estados com os parâmetros ou valores padrão
  const [tipoFiltro, setTipoFiltro] = useState(params.tipoFiltro || "TODOS");
  const [dataInicio, setDataInicio] = useState(initialDateStart);
  const [dataFim, setDataFim] = useState(initialDateEnd);

  const [lancamentos, setLancamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPickerInicio, setShowPickerInicio] = useState(false);
  const [showPickerFim, setShowPickerFim] = useState(false);

  const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/lancamentos/filtrar`;

  // 3. Atualiza os filtros caso o usuário navegue no Dashboard
  useFocusEffect(
    useCallback(() => {
      if (route.params) {
        if (route.params.tipoFiltro) setTipoFiltro(route.params.tipoFiltro);
        if (route.params.mesFiltro && route.params.anoFiltro) {
          setDataInicio(
            new Date(route.params.anoFiltro, route.params.mesFiltro - 1, 1),
          );
          setDataFim(
            new Date(route.params.anoFiltro, route.params.mesFiltro, 0),
          );
        }
      }
    }, [route.params]),
  );

  // 4. Dispara a busca sempre que as datas ou o tipo mudarem
  useEffect(() => {
    carregarExtrato();
  }, [dataInicio, dataFim, tipoFiltro]);

  const carregarExtrato = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("@FluxoInteligente:token");

      // Mês e ano extraídos da data início para mandar pro novo endpoint do backend
      const mes = dataInicio.getMonth() + 1;
      const ano = dataInicio.getFullYear();

      // Se for "TODOS", não enviamos o parâmetro 'tipo' pro backend
      const queryTipo = tipoFiltro === "TODOS" ? "" : `&tipo=${tipoFiltro}`;

      // Usa o endpoint: /lancamentos/filtrar?mes=X&ano=Y&tipo=Z
      const response = await axios.get(
        `${API_URL}?mes=${mes}&ano=${ano}${queryTipo}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setLancamentos(response.data);
    } catch (error) {
      console.error("Erro ao buscar extrato", error);
    } finally {
      setLoading(false);
    }
  };

  const calcularSaldoFiltrado = () => {
    return lancamentos.reduce((acc, atual) => {
      return atual.tipo === "RECEITA" ? acc + atual.valor : acc - atual.valor;
    }, 0);
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const renderItem = ({ item }) => (
    <View style={styles.lancamentoCard}>
      <View style={styles.lancamentoInfo}>
        <Text style={styles.descricao}>{item.descricao}</Text>
        <Text style={styles.data}>
          {item.data.split("-").reverse().join("/")}
        </Text>
      </View>
      <Text
        style={[
          styles.valor,
          { color: item.tipo === "RECEITA" ? "#2e7d32" : "#c62828" },
        ]}
      >
        {item.tipo === "RECEITA" ? "+ " : "- "}
        {formatarMoeda(item.valor)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titulo}>Extrato Financeiro</Text>

      {/* Abas para trocar o filtro visualmente */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, tipoFiltro === "TODOS" && styles.tabActive]}
          onPress={() => setTipoFiltro("TODOS")}
        >
          <Text
            style={[
              styles.tabText,
              tipoFiltro === "TODOS" && styles.tabTextActive,
            ]}
          >
            Todos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tipoFiltro === "RECEITA" && styles.tabActive]}
          onPress={() => setTipoFiltro("RECEITA")}
        >
          <Text
            style={[
              styles.tabText,
              tipoFiltro === "RECEITA" && styles.tabTextActive,
            ]}
          >
            Receitas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tipoFiltro === "DESPESA" && styles.tabActive]}
          onPress={() => setTipoFiltro("DESPESA")}
        >
          <Text
            style={[
              styles.tabText,
              tipoFiltro === "DESPESA" && styles.tabTextActive,
            ]}
          >
            Despesas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Seção de Filtros de Data*/}
      <View style={styles.filtroContainer}>
        <TouchableOpacity
          onPress={() => setShowPickerInicio(true)}
          style={styles.dateBtn}
        >
          <Text style={styles.dateText}>
            De: {dataInicio.toLocaleDateString("pt-BR")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowPickerFim(true)}
          style={styles.dateBtn}
        >
          <Text style={styles.dateText}>
            Até: {dataFim.toLocaleDateString("pt-BR")}
          </Text>
        </TouchableOpacity>
      </View>

      {showPickerInicio && (
        <DateTimePicker
          value={dataInicio}
          mode="date"
          onChange={(event, date) => {
            setShowPickerInicio(false);
            if (date) setDataInicio(date);
          }}
        />
      )}

      {showPickerFim && (
        <DateTimePicker
          value={dataFim}
          mode="date"
          onChange={(event, date) => {
            setShowPickerFim(false);
            if (date) setDataFim(date);
          }}
        />
      )}

      {/* Seção: Saldo no Topo */}
      <View style={styles.saldoContainer}>
        <Text style={styles.saldoLabel}>Saldo do Período</Text>
        <Text
          style={[
            styles.saldoValor,
            { color: calcularSaldoFiltrado() >= 0 ? "#2e7d32" : "#c62828" },
          ]}
        >
          {formatarMoeda(calcularSaldoFiltrado())}
        </Text>
      </View>

      {/* Lista de Transações */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2e7d32"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={lancamentos}
          keyExtractor={(item) =>
            item.id ? item.id.toString() : Math.random().toString()
          }
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum lançamento no período.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1b5e20",
    marginBottom: 15,
  },
  // ESTILOS PARA AS ABAS DE FILTRO
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    marginBottom: 15,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: "#fff",
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "bold",
  },
  tabTextActive: {
    color: "#1b5e20",
  },
  filtroContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  dateBtn: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    width: "48%",
    alignItems: "center",
    elevation: 2,
  },
  dateText: {
    color: "#333",
    fontWeight: "500",
  },
  saldoContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saldoLabel: {
    fontSize: 14,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 5,
  },
  saldoValor: {
    fontSize: 32,
    fontWeight: "bold",
  },
  lancamentoCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
  },
  lancamentoInfo: {
    flex: 1,
  },
  descricao: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  data: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  valor: {
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    marginTop: 30,
  },
});
