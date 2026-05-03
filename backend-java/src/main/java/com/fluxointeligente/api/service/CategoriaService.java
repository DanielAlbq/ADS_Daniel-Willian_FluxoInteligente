package com.fluxointeligente.api.service;

import com.fluxointeligente.api.models.Categoria;
import com.fluxointeligente.api.models.Usuario;
import com.fluxointeligente.api.repositories.CategoriaRepository;
import com.fluxointeligente.api.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class CategoriaService {

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // Método auxiliar para pegar o usuário do Token
    private Usuario getUsuarioLogado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String emailLogado = auth.getName();
        return usuarioRepository.findByEmail(emailLogado)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));
    }

    public Categoria salvar(Categoria categoria) {
        // Vincula automaticamente o usuário logado
        categoria.setUsuario(getUsuarioLogado());
        return categoriaRepository.save(categoria);
    }

    public List<Categoria> listarMinhasCategorias() {
        Usuario usuario = getUsuarioLogado();
        return categoriaRepository.findByUsuarioIdUsuario(usuario.getIdUsuario());
    }

    public void deletar(UUID idCategoria) {
        Categoria categoria = categoriaRepository.findById(idCategoria)
                .orElseThrow(() -> new RuntimeException("Categoria não encontrada."));

        Usuario usuarioLogado = getUsuarioLogado();

        // Trava de segurança: impede que um usuário delete a categoria de outro
        if (!categoria.getUsuario().getIdUsuario().equals(usuarioLogado.getIdUsuario())) {
            throw new RuntimeException("Acesso negado.");
        }

        categoriaRepository.delete(categoria);
    }
}