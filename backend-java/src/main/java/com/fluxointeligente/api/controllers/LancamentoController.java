package com.fluxointeligente.api.controllers;

import com.fluxointeligente.api.models.Lancamento;
import com.fluxointeligente.api.models.TipoLancamento;
import com.fluxointeligente.api.service.LancamentoService;
import com.fluxointeligente.api.dtos.LancamentoParceladoDTO;

import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/lancamentos")
public class LancamentoController {

    @Autowired
    private LancamentoService service;

    @GetMapping("/saldo")
    public ResponseEntity<Map<String, BigDecimal>> obterSaldoTotal() {
        Map<String, BigDecimal> dadosDashboard = service.obterResumoDashboard();
        return ResponseEntity.ok(dadosDashboard);
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

    // Rota para o Extrato
    @GetMapping("/extrato")
    public ResponseEntity<List<Lancamento>> obterExtrato(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {

        List<Lancamento> lancamentos = service.listarExtrato(dataInicio, dataFim);
        return ResponseEntity.ok(lancamentos);
    }

    @GetMapping("/filtrar")
    public ResponseEntity<List<Lancamento>> listarComFiltros(
            @RequestParam(required = false) TipoLancamento tipo,
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate dataInicio,
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate dataFim) {
        List<Lancamento> lancamentos = service.buscarPorFiltros(tipo, dataInicio, dataFim);
        return ResponseEntity.ok(lancamentos);
    }

    @PostMapping("/parcelado")
    public ResponseEntity<List<Lancamento>> criarParcelado(@RequestBody LancamentoParceladoDTO dto) {
        if (dto.getQuantidadeParcelas() == null || dto.getQuantidadeParcelas() <= 1) {
            Lancamento salvo = service.salvar(dto.getLancamento());
            return ResponseEntity.status(HttpStatus.CREATED).body(List.of(salvo));
        }

        List<Lancamento> salvos = service.salvarParcelado(dto.getLancamento(), dto.getQuantidadeParcelas());
        return ResponseEntity.status(HttpStatus.CREATED).body(salvos);
    }

    // Atualizar um lançamento existente
    @PutMapping("/{id}")
    public ResponseEntity<Lancamento> atualizar(@PathVariable UUID id, @RequestBody Lancamento lancamento) {
        Lancamento atualizado = service.atualizar(id, lancamento);
        return ResponseEntity.ok(atualizado);
    }

    @PatchMapping("/{id}/pagar")
    public ResponseEntity<Lancamento> marcarComoPago(@PathVariable UUID id) {
        Lancamento lancamentoPago = service.marcarComoPago(id);
        return ResponseEntity.ok(lancamentoPago);
    }

    // Deletar um lançamento com validação de posse
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable UUID id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}