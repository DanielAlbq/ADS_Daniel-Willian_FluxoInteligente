package com.fluxointeligente.api.controllers;

import com.fluxointeligente.api.service.LancamentoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
import java.util.Map;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*") // Permite chamadas do React Native
public class DashboardController {

    @Autowired
    private LancamentoService lancamentoService;

    @GetMapping("/{usuarioId}/resumo")
    public ResponseEntity<Map<String, BigDecimal>> obterResumo(@PathVariable UUID usuarioId) {

        // Em vez de ir ao repositório fazer os cálculos "na mão", chamamos o Service.
        // O Service já devolve o Saldo, Receitas Pagas, Despesas Pagas, e as Contas
        // Pendentes!
        Map<String, BigDecimal> resumo = lancamentoService.obterResumoDashboard();

        // O Spring Boot converte automaticamente este Map para um JSON perfeito,
        // tornando o DashboardResumoDTO desnecessário para este caso.
        return ResponseEntity.ok(resumo);
    }
}