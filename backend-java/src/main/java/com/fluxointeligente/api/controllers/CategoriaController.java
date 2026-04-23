package com.fluxointeligente.api.controllers;

import com.fluxointeligente.api.models.Categoria;
import com.fluxointeligente.api.repositories.CategoriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/categorias")
public class CategoriaController {

    @Autowired
    private CategoriaRepository categoriaRepository;

    @GetMapping("/usuario/{idUsuario}")
    public List<Categoria> listarPorUsuario(@PathVariable UUID idUsuario) {
        return categoriaRepository.findByUsuarioIdUsuario(idUsuario);
    }

    @PostMapping
    public Categoria criar(@RequestBody Categoria categoria) {
        return categoriaRepository.save(categoria);
    }

    @DeleteMapping("/{idCategoria}")
    public ResponseEntity<Void> deletar(@PathVariable UUID idCategoria) {
        if (categoriaRepository.existsById(idCategoria)) {
            categoriaRepository.deleteById(idCategoria);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
