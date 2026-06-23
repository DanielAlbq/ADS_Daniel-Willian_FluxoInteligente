package com.fluxointeligente.api.repositories;

import com.fluxointeligente.api.models.Lancamento;
import com.fluxointeligente.api.models.StatusLancamento;
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

        // Busca todos os lançamentos de um utilizador específico
        List<Lancamento> findByUsuarioIdUsuario(UUID usuarioId);

        List<Lancamento> findByUsuarioIdUsuarioAndTipo(UUID usuarioId, String tipo);

        List<Lancamento> findByIdentificadorParcelamento(String identificadorParcelamento);

        List<Lancamento> findByUsuarioIdUsuarioAndDataBetween(UUID usuarioId, java.time.LocalDate inicio,
                        java.time.LocalDate fim);

        // --- MUDANÇA AQUI: Filtramos agora pelo STATUS também ---
        @Query("SELECT SUM(l.valor) FROM Lancamento l WHERE l.usuario.idUsuario = :usuarioId AND l.tipo = :tipo AND l.status = :status")
        BigDecimal somarPorUsuarioETipoEStatus(@Param("usuarioId") UUID usuarioId, @Param("tipo") TipoLancamento tipo,
                        @Param("status") StatusLancamento status);

        // filtro para lancamentos futuros (mantido para compatibilidade, caso use
        // noutro lado)
        @Query("SELECT SUM(l.valor) FROM Lancamento l WHERE l.usuario.idUsuario = :usuarioId AND l.tipo = :tipo AND l.data > CURRENT_DATE")
        BigDecimal somarPrevistoPorUsuarioETipo(@Param("usuarioId") UUID usuarioId, @Param("tipo") TipoLancamento tipo);

        // --- MUDANÇA AQUI: O Saldo Atual SÓ SOMA O QUE ESTÁ PAGO ---
        @Query("SELECT COALESCE(SUM(CASE WHEN l.tipo = 'RECEITA' THEN l.valor ELSE -l.valor END), 0) "
                        + "FROM Lancamento l WHERE l.usuario.idUsuario = :idUsuario AND l.status = 'PAGO'")
        BigDecimal calcularSaldoAtual(@Param("idUsuario") UUID idUsuario);

        // Busca os lançamentos por período (mês/ano) e pelo tipo.
        @Query("SELECT l FROM Lancamento l WHERE " +
                        "(:tipo IS NULL OR l.tipo = :tipo) AND " +
                        "(l.data BETWEEN :dataInicio AND :dataFim) " +
                        "ORDER BY l.data DESC")
        List<Lancamento> findByFiltrosExtrato(
                        @Param("tipo") TipoLancamento tipo,
                        @Param("dataInicio") java.time.LocalDate dataInicio,
                        @Param("dataFim") java.time.LocalDate dataFim);

        @Query("SELECT SUM(l.valor) FROM Lancamento l WHERE l.usuario.idUsuario = :usuarioId AND l.tipo = :tipo AND l.status = 'PAGO'")
        BigDecimal somarPorUsuarioETipo(@Param("usuarioId") UUID usuarioId, @Param("tipo") TipoLancamento tipo);
}