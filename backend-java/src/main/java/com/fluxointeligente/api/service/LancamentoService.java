package com.fluxointeligente.api.service;

import com.fluxointeligente.api.models.TipoLancamento;
import com.fluxointeligente.api.repositories.LancamentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class LancamentoService {

    @Autowired
    private LancamentoRepository repository;

    public BigDecimal calcularSaldoAtual(UUID usuarioId) {
        BigDecimal receitas = repository.somarPorUsuarioETipo(usuarioId, TipoLancamento.RECEITA);
        BigDecimal despesas = repository.somarPorUsuarioETipo(usuarioId, TipoLancamento.DESPESA);

        // tratar os valores nulos caso não haja valores de lancamentos
        receitas = (receitas != null) ? receitas : BigDecimal.ZERO;
        despesas = (despesas != null) ? despesas : BigDecimal.ZERO;

        return receitas.subtract(despesas);
    }
}
