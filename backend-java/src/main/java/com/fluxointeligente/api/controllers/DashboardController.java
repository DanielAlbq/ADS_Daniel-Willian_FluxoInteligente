package com.fluxointeligente.api.controllers;

import com.fluxointeligente.api.dtos.DashboardResumoDTO;
import com.fluxointeligente.api.models.TipoLancamento;
import com.fluxointeligente.api.repositories.LancamentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*") // Permite chamadas do React Native
public class DashboardController {

    @Autowired
    private LancamentoRepository lancamentoRepository;

    // Importe o UUID lá no topo: import java.util.UUID;

    @GetMapping("/{usuarioId}/resumo")
    public ResponseEntity<DashboardResumoDTO> obterResumo(@PathVariable UUID usuarioId) {
        // ... resto do código continua igual ...{

        // 1. Busca a soma das Receitas (Se for null, assume ZERO)
        BigDecimal receitas = lancamentoRepository.somarPorUsuarioETipo(usuarioId, TipoLancamento.RECEITA);
        if (receitas == null) receitas = BigDecimal.ZERO;

        // 2. Busca a soma das Despesas (Se for null, assume ZERO)
        BigDecimal despesas = lancamentoRepository.somarPorUsuarioETipo(usuarioId, TipoLancamento.DESPESA);
        if (despesas == null) despesas = BigDecimal.ZERO;

        // 3. Calcula o Saldo (Receitas - Despesas)
        BigDecimal saldo = receitas.subtract(despesas);

        // 4. Monta a resposta DTO e envia para o app
        DashboardResumoDTO resumo = new DashboardResumoDTO(saldo, receitas, despesas);

        return ResponseEntity.ok(resumo);
    }
}