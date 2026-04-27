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

    // Esta é a data de competência (quando o gasto ocorreu ou foi planejado)
    @Column(nullable = false)
    private LocalDate data;

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
}