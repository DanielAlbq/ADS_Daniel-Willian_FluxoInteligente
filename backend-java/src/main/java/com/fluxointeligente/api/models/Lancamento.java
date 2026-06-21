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

    @Column(nullable = false)
    private LocalDate data;

    @Column(name = "identificador_parcelamento")
    private String identificadorParcelamento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusLancamento status = StatusLancamento.PAGO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoLancamento tipo; // RECEITA ou DESPESA

    // Data em que o lançamento foi efetivamente pago/recebido
    private LocalDate dataPagamento;

    @PrePersist
    protected void onCreate() {
        if (this.data == null) {
            this.data = LocalDate.now();
        }
        // Garante a consistência: se tem data de pagamento, o status não pode ser
        // pendente
        if (this.dataPagamento != null && this.status == StatusLancamento.PENDENTE) {
            this.status = StatusLancamento.PAGO;
        }
    }

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "categoria_id", nullable = false)
    private Categoria categoria;

    @ManyToOne
    @JoinColumn(name = "fornecedor_id")
    private Fornecedor fornecedor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "arquivo_id")
    private ArquivoComprovante arquivo;
}