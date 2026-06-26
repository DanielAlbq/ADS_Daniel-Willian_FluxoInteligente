package com.fluxointeligente.api.service;

import com.fluxointeligente.api.models.Lancamento;
import com.fluxointeligente.api.models.StatusLancamento;
import com.fluxointeligente.api.models.TipoLancamento;
import com.fluxointeligente.api.models.Usuario;
import com.fluxointeligente.api.repositories.LancamentoRepository;
import com.fluxointeligente.api.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.ArrayList;

@Service
public class LancamentoService {

    @Autowired
    private LancamentoRepository repository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // --- MÉTODOS DE SEGURANÇA ---
    private Usuario getUsuarioLogado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String emailLogado = (String) auth.getPrincipal();

        return usuarioRepository.findByEmail(emailLogado)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado ou token inválido"));
    }

    // --- REGRAS DE NEGÓCIO ---
    public Lancamento salvar(Lancamento lancamento) {
        Usuario usuario = getUsuarioLogado();
        lancamento.setUsuario(usuario);
        Lancamento salvo = repository.save(lancamento);
        return repository.findById(salvo.getId()).orElse(salvo);
    }

    /**
     * DASHBOARD CONSOLIDADO:
     * Calcula o Saldo Real (Apenas Pagos) e as Previsões (Pendentes)
     */
    public Map<String, BigDecimal> obterResumoDashboard() {
        Usuario usuario = getUsuarioLogado();
        UUID idUsuario = usuario.getIdUsuario();

        Map<String, BigDecimal> dashboard = new HashMap<>();

        // 1. SALDO REAL (Regime de Caixa - O que realmente aconteceu)
        BigDecimal saldo = repository.calcularSaldoAtual(idUsuario);
        BigDecimal receitasPagas = repository.somarPorUsuarioETipoEStatus(idUsuario, TipoLancamento.RECEITA,
                StatusLancamento.PAGO);
        BigDecimal despesasPagas = repository.somarPorUsuarioETipoEStatus(idUsuario, TipoLancamento.DESPESA,
                StatusLancamento.PAGO);

        // 2. PREVISÕES (Regime de Competência - Contas a Pagar/Receber)
        BigDecimal receitasPendentes = repository.somarPorUsuarioETipoEStatus(idUsuario, TipoLancamento.RECEITA,
                StatusLancamento.PENDENTE);
        BigDecimal despesasPendentes = repository.somarPorUsuarioETipoEStatus(idUsuario, TipoLancamento.DESPESA,
                StatusLancamento.PENDENTE);

        // 3. Montar o JSON de resposta evitando valores nulos
        dashboard.put("saldo", saldo != null ? saldo : BigDecimal.ZERO);
        dashboard.put("receitas", receitasPagas != null ? receitasPagas : BigDecimal.ZERO);
        dashboard.put("despesas", despesasPagas != null ? despesasPagas : BigDecimal.ZERO);
        dashboard.put("contasAReceber", receitasPendentes != null ? receitasPendentes : BigDecimal.ZERO);
        dashboard.put("contasAPagar", despesasPendentes != null ? despesasPendentes : BigDecimal.ZERO);

        return dashboard;
    }

    public List<Lancamento> listarPorUsuarioLogado() {
        Usuario usuario = getUsuarioLogado();
        return repository.findByUsuarioIdUsuario(usuario.getIdUsuario());
    }

    public void deletar(UUID idLancamento) {
        Lancamento lancamento = repository.findById(idLancamento)
                .orElseThrow(() -> new RuntimeException("Lançamento não encontrado."));

        Usuario usuarioLogado = getUsuarioLogado();

        if (!lancamento.getUsuario().getIdUsuario().equals(usuarioLogado.getIdUsuario())) {
            throw new RuntimeException("Acesso negado: Você não tem permissão para deletar este registro.");
        }

        if (lancamento.getIdentificadorParcelamento() != null) {
            List<Lancamento> parcelasDoGrupo = repository
                    .findByIdentificadorParcelamento(lancamento.getIdentificadorParcelamento());
            repository.deleteAll(parcelasDoGrupo);
        } else {
            repository.delete(lancamento);
        }
    }

    public List<Lancamento> listarExtrato(LocalDate dataInicio, LocalDate dataFim) {
        Usuario usuario = getUsuarioLogado();
        if (dataInicio != null && dataFim != null) {
            return repository.findByUsuarioIdUsuarioAndDataBetween(usuario.getIdUsuario(), dataInicio, dataFim);
        }
        return repository.findByUsuarioIdUsuario(usuario.getIdUsuario());
    }

    public List<Lancamento> buscarPorFiltros(TipoLancamento tipo, java.time.LocalDate dataInicio,
            java.time.LocalDate dataFim) {
        Usuario usuario = getUsuarioLogado();

        return repository.findByFiltrosExtrato(usuario.getIdUsuario(), tipo, dataInicio, dataFim);
    }

    public List<Lancamento> salvarParcelado(Lancamento lancamentoBase, int quantidadeParcelas) {
        Usuario usuario = getUsuarioLogado();
        List<Lancamento> parcelasSalvas = new ArrayList<>();
        String idGrupoParcelamento = java.util.UUID.randomUUID().toString();

        BigDecimal valorParcela = lancamentoBase.getValor()
                .divide(new BigDecimal(quantidadeParcelas), 2, java.math.RoundingMode.HALF_UP);
        LocalDate dataInicial = lancamentoBase.getData() != null ? lancamentoBase.getData() : LocalDate.now();

        for (int i = 0; i < quantidadeParcelas; i++) {
            Lancamento parcela = new Lancamento();
            parcela.setUsuario(usuario);
            parcela.setCategoria(lancamentoBase.getCategoria());
            parcela.setFornecedor(lancamentoBase.getFornecedor());
            parcela.setTipo(lancamentoBase.getTipo());
            parcela.setValor(valorParcela);
            parcela.setData(dataInicial.plusMonths(i));
            parcela.setDescricao(lancamentoBase.getDescricao() + " (" + (i + 1) + "/" + quantidadeParcelas + ")");
            parcela.setStatus(lancamentoBase.getStatus()); // Mantém o status original
            parcela.setIdentificadorParcelamento(idGrupoParcelamento);

            parcelasSalvas.add(repository.save(parcela));
        }
        return parcelasSalvas;
    }

    // --- NOVO: Método para o botão "Pagar" no extrato ---
    public Lancamento marcarComoPago(UUID id) {
        Lancamento lancamento = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lançamento não encontrado"));

        lancamento.setStatus(StatusLancamento.PAGO);
        lancamento.setDataPagamento(LocalDate.now());

        return repository.save(lancamento);
    }

    // --- CORREÇÃO: Atualização de Lançamento editado ---
    public Lancamento atualizar(UUID idLancamento, Lancamento dadosAtualizados) {
        Lancamento existente = repository.findById(idLancamento)
                .orElseThrow(() -> new RuntimeException("Lançamento não encontrado."));

        Usuario usuarioLogado = getUsuarioLogado();

        if (!existente.getUsuario().getIdUsuario().equals(usuarioLogado.getIdUsuario())) {
            throw new RuntimeException("Acesso negado: Você não tem permissão para editar este registro.");
        }

        existente.setDescricao(dadosAtualizados.getDescricao());
        existente.setValor(dadosAtualizados.getValor());
        existente.setData(dadosAtualizados.getData());
        existente.setCategoria(dadosAtualizados.getCategoria());
        existente.setFornecedor(dadosAtualizados.getFornecedor());

        // Atualiza o status
        existente.setStatus(dadosAtualizados.getStatus());

        // Regra de datas conforme estado de pagamento
        if (dadosAtualizados.getStatus() == StatusLancamento.PAGO && existente.getDataPagamento() == null) {
            existente.setDataPagamento(LocalDate.now());
        } else if (dadosAtualizados.getStatus() == StatusLancamento.PENDENTE) {
            existente.setDataPagamento(null);
        }

        return repository.save(existente);
    }
}