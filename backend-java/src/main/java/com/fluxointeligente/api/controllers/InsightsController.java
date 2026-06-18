package com.fluxointeligente.api.controllers;

import com.fluxointeligente.api.models.Usuario;
import com.fluxointeligente.api.models.TipoLancamento;
import com.fluxointeligente.api.repositories.LancamentoRepository;
import com.fluxointeligente.api.repositories.UsuarioRepository;
import com.fluxointeligente.api.service.InsightsService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/insights")
public class InsightsController {

    @Autowired
    private InsightsService insightsService;

    @Autowired
    private LancamentoRepository lancamentoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    private Usuario getUsuarioLogado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String emailLogado = auth.getName();
        return usuarioRepository.findByEmail(emailLogado)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado no contexto de segurança."));
    }

    @GetMapping("/gerar")
    public ResponseEntity<Map<String, String>> gerarInsights() {
        try {
            Usuario usuarioLogado = getUsuarioLogado();
            UUID usuarioId = usuarioLogado.getIdUsuario();

            BigDecimal saldoAtual = lancamentoRepository.calcularSaldoAtual(usuarioId);

            BigDecimal receitasTotais = lancamentoRepository.somarPorUsuarioETipo(usuarioId, TipoLancamento.RECEITA);
            BigDecimal despesasTotais = lancamentoRepository.somarPorUsuarioETipo(usuarioId, TipoLancamento.DESPESA);

            BigDecimal receitasPrevistas = lancamentoRepository.somarPrevistoPorUsuarioETipo(usuarioId,
                    TipoLancamento.RECEITA);
            BigDecimal despesasPrevistas = lancamentoRepository.somarPrevistoPorUsuarioETipo(usuarioId,
                    TipoLancamento.DESPESA);

            saldoAtual = saldoAtual != null ? saldoAtual : BigDecimal.ZERO;
            receitasTotais = receitasTotais != null ? receitasTotais : BigDecimal.ZERO;
            despesasTotais = despesasTotais != null ? despesasTotais : BigDecimal.ZERO;
            receitasPrevistas = receitasPrevistas != null ? receitasPrevistas : BigDecimal.ZERO;
            despesasPrevistas = despesasPrevistas != null ? despesasPrevistas : BigDecimal.ZERO;

            // Formata o contexto financeiro do usuario logado
            String contextoFinanceiro = String.format(
                    "Saldo Atual em Caixa: R$ %.2f. " +
                            "Histórico Consolidado - Receitas Totais: R$ %.2f, Despesas Totais: R$ %.2f. " +
                            "Previsão Futura (Lançamentos não pagos) - Valores a Receber: R$ %.2f, Contas a Pagar: R$ %.2f.",
                    saldoAtual, receitasTotais, despesasTotais, receitasPrevistas, despesasPrevistas);

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