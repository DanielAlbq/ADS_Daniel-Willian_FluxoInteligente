package com.fluxointeligente.api.service;

import com.fluxointeligente.api.models.Fornecedor;
import com.fluxointeligente.api.models.Usuario;
import com.fluxointeligente.api.repositories.FornecedorRepository;
import com.fluxointeligente.api.repositories.UsuarioRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;

import java.util.List;

@Service
public class FornecedorService {

    @Autowired
    private FornecedorRepository repository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    private Usuario getUsuarioAutenticado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String emailLogado = (String) auth.getPrincipal();

        return usuarioRepository.findByEmail(emailLogado)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado ou token inválido"));
    }

    public Fornecedor salvar(Fornecedor fornecedor) {
        Usuario usuarioLogado = getUsuarioAutenticado();

        // (Opcional) Validação de CNPJ que comentamos antes:
        // if (repository.existsByCnpjAndUsuario(fornecedor.getCnpj(), usuarioLogado)) {
        // throw new RuntimeException("Já existe um fornecedor com este CNPJ.");
        // }

        fornecedor.setUsuario(usuarioLogado);
        return repository.save(fornecedor);
    }

    public List<Fornecedor> listarPorUsuarioLogado() {
        Usuario usuarioLogado = getUsuarioAutenticado();
        return repository.findByUsuario(usuarioLogado);
    }

    public void deletar(Long id) {
        Usuario usuarioLogado = getUsuarioAutenticado();

        Fornecedor fornecedor = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fornecedor não encontrado"));

        // Garante que o usuário só exclui o que é dele
        if (fornecedor.getUsuario().getId().equals(usuarioLogado.getId())) {
            repository.delete(fornecedor);
        } else {
            throw new RuntimeException("Acesso negado");
        }
    }
}