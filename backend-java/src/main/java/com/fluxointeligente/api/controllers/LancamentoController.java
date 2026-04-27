package com.fluxointeligente.api.controllers;

import com.fluxointeligente.api.models.Lancamento;
import com.fluxointeligente.api.repositories.LancamentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/lancamentos")
public class LancamentoController {

    @Autowired
    private LancamentoRepository repository;

    // Listar todos os lançamentos de um usuário específico
    // Essencial para o "Controle de Entradas e Saídas"
    @GetMapping("/usuario/{usuarioId}")
    public List<Lancamento> listarPorUsuario(@PathVariable UUID usuarioId) {
        return repository.findByUsuarioIdUsuario(usuarioId);
    }

    // Criar um novo lançamento (Receita ou Despesa)
    @PostMapping
    public ResponseEntity<Lancamento> criar(@RequestBody Lancamento lancamento) {
        // Aqui, futuramente, podemos adicionar a lógica:
        // "Se data for null, data = hoje" para compras à vista
        Lancamento salvo = repository.save(lancamento);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    // Deletar um lançamento
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable UUID id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}