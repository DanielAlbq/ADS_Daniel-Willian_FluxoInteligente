import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

export default function ExtratoScreen({ route, navigation }) {
  const params = route.params || {};

  const initialDateStart =
    params.mesFiltro && params.anoFiltro
      ? new Date(params.anoFiltro, params.mesFiltro - 1, 1)
      : new Date(new Date().setDate(1));

  const initialDateEnd =
    params.mesFiltro && params.anoFiltro
      ? new Date(params.anoFiltro, params.mesFiltro, 0)
      : new Date();

  const [tipoFiltro, setTipoFiltro] = useState(params.tipoFiltro || "TODOS");
  const [dataInicio, setDataInicio] = useState(initialDateStart);
  const [dataFim, setDataFim] = useState(initialDateEnd);

  const [lancamentos, setLancamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPickerInicio, setShowPickerInicio] = useState(false);
  const [showPickerFim, setShowPickerFim] = useState(false);

  const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/lancamentos/filtrar`;

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

  useEffect(() => {
    carregarExtrato();
  }, [dataInicio, dataFim, tipoFiltro]);

  const carregarExtrato = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("@FluxoInteligente:token");

      const formatarData = (data) => {
        const year = data.getFullYear();
        const month = String(data.getMonth() + 1).padStart(2, "0");
        const day = String(data.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const inicioFormatado = formatarData(dataInicio);
      const fimFormatado = formatarData(dataFim);

      const queryTipo = tipoFiltro === "TODOS" ? "" : `&tipo=${tipoFiltro}`;

      const response = await axios.get(
        `${API_URL}?dataInicio=${inicioFormatado}&dataFim=${fimFormatado}${queryTipo}`,
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

  // --- AGRUPA OS LANÇAMENTOS POR DATA ---
  const agruparLancamentos = () => {
    // 1. Cria um objeto agrupando as datas
    const grupos = lancamentos.reduce((acc, lancamento) => {
      const data = lancamento.data;
      if (!acc[data]) {
        acc[data] = [];
      }
      acc[data].push(lancamento);
      return acc;
    }, {});

    // 2. Transforma o objeto no Array de "Sections" que o React Native exige e ordena do mais recente para o mais antigo
    const secoes = Object.keys(grupos)
      .sort((a, b) => new Date(b) - new Date(a))
      .map((dataKey) => {
        const dataExibicao = dataKey.split("-").reverse().join("/");
        return {
          title: dataExibicao,
          data: grupos[dataKey],
        };
      });

    return secoes;
  };

  // --- RENDER DO CABEÇALHO DA SEÇÃO (A DATA) ---
  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeaderContainer}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  // --- RENDER DO ITEM (O CARTÃO DO LANÇAMENTO) ---
  const renderItem = ({ item }) => (
    <View style={styles.lancamentoCard}>
      <View style={styles.lancamentoInfo}>
        <Text style={styles.descricao}>{item.descricao}</Text>
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

  const exportarExcel = async () => {
    if (lancamentos.length === 0) {
      Alert.alert("Aviso", "Não há lançamentos para exportar neste período.");
      return;
    }

    try {
      let csvString = "Data;Descricao;Tipo;Valor\n";

      lancamentos.forEach((l) => {
        const dataFormatada = l.data.split("-").reverse().join("/");
        const valorFormatado = new Intl.NumberFormat("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(l.valor);
        csvString += `${dataFormatada};${l.descricao};${l.tipo};${valorFormatado}\n`;
      });

      const fileUri =
        FileSystem.documentDirectory + "extrato_fluxo_inteligente.csv";

      await FileSystem.writeAsStringAsync(fileUri, csvString);

      await Sharing.shareAsync(fileUri, {
        dialogTitle: "Exportar Extrato Excel",
        mimeType: "text/csv",
        UTI: "public.comma-separated-values-text",
      });
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      Alert.alert("Erro", "Não foi possível gerar o arquivo Excel.");
    }
  };

  const exportarPDF = async () => {
    if (lancamentos.length === 0) {
      Alert.alert("Aviso", "Não há lançamentos para exportar neste período.");
      return;
    }

    try {
      let htmlRows = "";
      lancamentos.forEach((l) => {
        const dataFormatada = l.data.split("-").reverse().join("/");
        const corValor = l.tipo === "RECEITA" ? "green" : "red";
        const sinal = l.tipo === "RECEITA" ? "+" : "-";

        htmlRows += `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${dataFormatada}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${l.descricao}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; color: ${corValor}; text-align: right;">
              ${sinal} ${formatarMoeda(l.valor)}
            </td>
          </tr>
        `;
      });

      const htmlContent = `
        <html>
          <body style="font-family: Helvetica, Arial, sans-serif; padding: 20px;">
            <h1 style="color: #1b5e20; text-align: center;">Fluxo Inteligente</h1>
            <h2 style="text-align: center;">Extrato Financeiro</h2>
            <p style="text-align: center; color: #666;">Período: ${dataInicio.toLocaleDateString("pt-BR")} a ${dataFim.toLocaleDateString("pt-BR")}</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <thead>
                <tr style="background-color: #2e7d32; color: white;">
                  <th style="padding: 10px; text-align: left;">Data</th>
                  <th style="padding: 10px; text-align: left;">Descrição</th>
                  <th style="padding: 10px; text-align: right;">Valor</th>
                </tr>
              </thead>
              <tbody>
                ${htmlRows}
              </tbody>
            </table>
            <h3 style="text-align: right; margin-top: 20px;">
              Saldo do Período: ${formatarMoeda(calcularSaldoFiltrado())}
            </h3>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { dialogTitle: "Exportar Extrato PDF" });
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      Alert.alert("Erro", "Não foi possível gerar o PDF.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* CABEÇALHO */}
      <View style={styles.headerExtrato}>
        <Text style={styles.tituloHeader}>Extrato</Text>

        <View style={styles.exportButtonsContainer}>
          <TouchableOpacity style={styles.exportBtn} onPress={exportarPDF}>
            <Text style={styles.exportBtnText}>📄 PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.exportBtn} onPress={exportarExcel}>
            <Text style={styles.exportBtnText}>📊 Excel</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ABAS DE FILTRO VISUAL */}
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

      {/* FILTROS DE DATA */}
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

      {/* SALDO DO PERÍODO */}
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

      {/* LISTA DE TRANSAÇÕES */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2e7d32"
          style={{ marginTop: 50 }}
        />
      ) : (
        <SectionList
          sections={agruparLancamentos()}
          keyExtractor={(item, index) =>
            item.id ? item.id.toString() : index.toString()
          }
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={{ paddingBottom: 20 }}
          stickySectionHeadersEnabled={false}
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
  tituloHeader: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1b5e20",
  },
  headerExtrato: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  exportButtonsContainer: {
    flexDirection: "row",
  },
  exportBtn: {
    backgroundColor: "#e0e0e0",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 10,
    elevation: 2,
  },
  exportBtnText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
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
  //  ESTILOS DO CABEÇALHO DA SEÇÃO (DATA)
  sectionHeaderContainer: {
    backgroundColor: "#e8f5e9", // Fundo verde bem claro para combinar com a app
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 15,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#2e7d32",
  },
  // ESTILOS DO CARTÃO
  lancamentoCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 8,
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
