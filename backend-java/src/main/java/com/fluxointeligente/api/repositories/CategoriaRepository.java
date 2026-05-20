package com.fluxointeligente.api.repositories;

import com.fluxointeligente.api.models.Categoria;
import com.fluxointeligente.api.models.TipoLancamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, UUID> {
    List<Categoria> findByUsuarioIdUsuario(UUID idUsuario);
    List<Categoria> findByUsuarioIdUsuarioAndTipo(UUID idUsuario, TipoLancamento tipo);
}
