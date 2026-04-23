package com.fluxointeligente.api.repositories;

import com.fluxointeligente.api.models.Lancamento;
import com.fluxointeligente.api.models.TipoLancamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.util.UUID;

public interface LancamentoRepository extends JpaRepository<Lancamento, Long> {

    // Retorna a soma de todos os valores de um usuário baseado no tipo (Receita ou Despesa)
    @Query("SELECT SUM(l.valor) FROM Lancamento l WHERE l.usuario.idUsuario = :usuarioId AND l.tipo = :tipo")
    BigDecimal somarPorUsuarioETipo(@Param("usuarioId") UUID usuarioId, @Param("tipo") TipoLancamento tipo);
}