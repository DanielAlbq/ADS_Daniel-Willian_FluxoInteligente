package com.fluxointeligente.api.controllers;

import com.fluxointeligente.api.models.Lancamento;
import com.fluxointeligente.api.service.LancamentoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal; // Importação necessária para o saldo
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/lancamentos")
public class LancamentoController {

    @Autowired
    private LancamentoService service;

    // 1. NOVO ENDPOINT: Busca o saldo total do usuário logado
    // Este é o endpoint que a sua HomeScreen precisa!
    @GetMapping("/saldo")
    public ResponseEntity<BigDecimal> obterSaldoTotal() {
        // Assume-se que seu service já tem a lógica de somar receitas e subtrair despesas
        BigDecimal saldo = service.calcularSaldoUsuarioLogado();
        return ResponseEntity.ok(saldo);
    }

    // Listar todos os lançamentos do usuário extraído do Token
    @GetMapping("/meus-lancamentos")
    public ResponseEntity<List<Lancamento>> listarMeusLancamentos() {
        List<Lancamento> lancamentos = service.listarPorUsuarioLogado();
        return ResponseEntity.ok(lancamentos);
    }

    // Criar um novo lançamento (Receita ou Despesa)
    @PostMapping
    public ResponseEntity<Lancamento> criar(@RequestBody Lancamento lancamento) {
        Lancamento salvo = service.salvar(lancamento);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    // Deletar um lançamento com validação de posse
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable UUID id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}