package com.fluxointeligente.api.controllers;

import com.fluxointeligente.api.service.InsightsService;
import com.fluxointeligente.api.service.LancamentoService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/insights")
public class InsightsController {

    @Autowired
    private InsightsService insightsService;

    // Substituímos o repositório pelo serviço para reaproveitar a regra de negócio
    @Autowired
    private LancamentoService lancamentoService;

    @GetMapping("/gerar")
    public ResponseEntity<Map<String, String>> gerarInsights() {
        try {
            // 1. Pega os cálculos perfeitos que já fizemos para o Dashboard
            Map<String, BigDecimal> resumo = lancamentoService.obterResumoDashboard();

            BigDecimal saldoAtual = resumo.get("saldo");
            BigDecimal receitasTotais = resumo.get("receitas"); // Já são apenas as PAGAS
            BigDecimal despesasTotais = resumo.get("despesas"); // Já são apenas as PAGAS
            BigDecimal receitasPrevistas = resumo.get("contasAReceber"); // As PENDENTES
            BigDecimal despesasPrevistas = resumo.get("contasAPagar"); // As PENDENTES

            // 2. Formata o contexto financeiro para a Inteligência Artificial
            String contextoFinanceiro = String.format(
                    "Saldo Atual em Caixa: R$ %.2f. " +
                            "Histórico Consolidado (Pagos) - Receitas: R$ %.2f, Despesas: R$ %.2f. " +
                            "Previsão Futura (Pendentes) - Valores a Receber: R$ %.2f, Contas a Pagar: R$ %.2f.",
                    saldoAtual, receitasTotais, despesasTotais, receitasPrevistas, despesasPrevistas);

            // 3. Envia para a IA analisar
            String textoInsight = insightsService.gerarAnaliseInteligente(contextoFinanceiro);

            Map<String, String> resposta = new HashMap<>();
            resposta.put("insight", textoInsight);

            return ResponseEntity.ok(resposta);

        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> erro = new HashMap<>();
            erro.put("erro", "Falha ao gerar análises: " + e.getMessage());
            return ResponseEntity.internalServerError().body(erro);
        }
    }
}