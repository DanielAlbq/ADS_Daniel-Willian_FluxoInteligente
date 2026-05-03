package com.fluxointeligente.api.controllers;

import com.fluxointeligente.api.models.Categoria;
import com.fluxointeligente.api.service.CategoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/categorias")
public class CategoriaController {

    @Autowired
    private CategoriaService categoriaService;

    // Listar apenas as categorias do usuário logado
    @GetMapping
    public ResponseEntity<List<Categoria>> listar() {
        return ResponseEntity.ok(categoriaService.listarMinhasCategorias());
    }

    @PostMapping
    public ResponseEntity<Categoria> criar(@RequestBody Categoria categoria) {
        Categoria categoriaSalva = categoriaService.salvar(categoria);
        return ResponseEntity.status(HttpStatus.CREATED).body(categoriaSalva);
    }

    @DeleteMapping("/{idCategoria}")
    public ResponseEntity<Void> deletar(@PathVariable UUID idCategoria) {
        categoriaService.deletar(idCategoria);
        return ResponseEntity.noContent().build();
    }
}