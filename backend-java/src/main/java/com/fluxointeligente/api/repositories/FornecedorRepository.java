package com.fluxointeligente.api.repositories;

import com.fluxointeligente.api.models.Fornecedor;
import com.fluxointeligente.api.models.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FornecedorRepository extends JpaRepository<Fornecedor, Long> {

    // Lista todos os fornecedores do usuário logado
    List<Fornecedor> findByUsuario(Usuario usuario);

    // Verifica se já existe um fornecedor com aquele CNPJ para aquele usuário
    boolean existsByCnpjAndUsuario(String cnpj, Usuario usuario);

    // Retorna o fornecedor buscando pelo CNPJ e garantindo que é do usuário logado
    Optional<Fornecedor> findByCnpjAndUsuario(String cnpj, Usuario usuario);
}