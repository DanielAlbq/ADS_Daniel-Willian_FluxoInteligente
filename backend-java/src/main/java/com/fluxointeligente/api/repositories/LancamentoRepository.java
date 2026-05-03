package com.fluxointeligente.api.repositories;

import com.fluxointeligente.api.models.Lancamento;
import com.fluxointeligente.api.models.TipoLancamento;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface LancamentoRepository extends JpaRepository<Lancamento, UUID> {

    
    // Busca todos os lançamentos de um usuário específico
    List<Lancamento> findByUsuarioIdUsuario(UUID usuarioId);

    // Busca lançamentos por tipo (RECEITA/DESPESA) de um usuário
    // Útil para calcular o total de entradas vs saídas separadamente
    List<Lancamento> findByUsuarioIdUsuarioAndTipo(UUID usuarioId, String tipo);

    // Busca lançamentos de um usuário em um determinado intervalo de datas
    List<Lancamento> findByUsuarioIdUsuarioAndDataBetween(UUID usuarioId, java.time.LocalDate inicio,
            java.time.LocalDate fim);

    @Query("SELECT SUM(l.valor) FROM Lancamento l WHERE l.usuario.idUsuario = :usuarioId AND l.tipo = :tipo")
    BigDecimal somarPorUsuarioETipo(@Param("usuarioId") UUID usuarioId, @Param("tipo") TipoLancamento tipo);

    // filtro para lancamentos futuros
    @Query("SELECT SUM(l.valor) FROM Lancamento l WHERE l.usuario.idUsuario = :usuarioId AND l.tipo = :tipo AND l.data > CURRENT_DATE")
    BigDecimal somarPrevistoPorUsuarioETipo(@Param("usuarioId") UUID usuarioId, @Param("tipo") TipoLancamento tipo);
}