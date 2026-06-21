package com.fluxointeligente.api.dtos;

import com.fluxointeligente.api.models.Lancamento;
import lombok.Data;

@Data
public class LancamentoParceladoDTO {
    private Lancamento lancamento;
    private Integer quantidadeParcelas;
}