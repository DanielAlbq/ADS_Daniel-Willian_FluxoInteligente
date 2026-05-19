package com.fluxointeligente.api.models;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "lancamentos")
public class Lancamento {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String descricao;

    @Column(nullable = false)
    private BigDecimal valor;

    @Column(nullable = false, updatable = false)
    private LocalDate data; // Data de inserção

    @PrePersist
    protected void onCreate() {
        if (this.data == null) {
            this.data = LocalDate.now(); // Define a data de hoje automaticamente antes de salvar
        }
    }

    @Enumerated(EnumType.STRING)
    private TipoLancamento tipo; // RECEITA ou DESPESA

    // Se estiver nulo, o sistema entende que foi uma compra à vista
    private LocalDate dataPagamento;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "categoria_id", nullable = false)
    private Categoria categoria;

    @ManyToOne
    @JoinColumn(name = "fornecedor_id")
    private Fornecedor fornecedor;
}