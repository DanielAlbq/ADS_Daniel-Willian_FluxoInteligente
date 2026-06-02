package com.fluxointeligente.api.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
@Entity
@Table(name = "arquivos_comprovante")
public class ArquivoComprovante {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nomeArquivo;

    @Column(nullable = false)
    private String tipoArquivo; // Vai guardar se é 'application/pdf' ou 'image/jpeg'

    @Column(columnDefinition = "TEXT", nullable = false)
    private String base64;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dataInsercao;

    @PrePersist
    protected void onCreate() {
        if (this.dataInsercao == null) {
            this.dataInsercao = LocalDateTime.now();
        }
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(columnDefinition = "TEXT")
    private String textoExtraido;

}