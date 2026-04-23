package com.fluxointeligente.api.dtos;

import java.math.BigDecimal;

public class DashboardResumoDTO {
    private BigDecimal saldoAtual;
    private BigDecimal totalReceitas;
    private BigDecimal totalDespesas;

    // Construtor
    public DashboardResumoDTO(BigDecimal saldoAtual, BigDecimal totalReceitas, BigDecimal totalDespesas) {
        this.saldoAtual = saldoAtual;
        this.totalReceitas = totalReceitas;
        this.totalDespesas = totalDespesas;
    }

    // Getters
    public BigDecimal getSaldoAtual() { return saldoAtual; }
    public BigDecimal getTotalReceitas() { return totalReceitas; }
    public BigDecimal getTotalDespesas() { return totalDespesas; }
}