package com.fluxointeligente.api.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "mensagens_chat")
public class MensagemChat {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID idMensagem;

    @ManyToOne
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @Column(nullable = false)
    private String remetente;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String texto;

    @Column(nullable = false)
    private LocalDateTime dataHora;

    public MensagemChat() {
    }

    public MensagemChat(Usuario usuario, String remetente, String texto, LocalDateTime dataHora) {
        this.usuario = usuario;
        this.remetente = remetente;
        this.texto = texto;
        this.dataHora = dataHora;
    }

    public UUID getIdMensagem() {
        return idMensagem;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public String getRemetente() {
        return remetente;
    }

    public String getTexto() {
        return texto;
    }

    public LocalDateTime getDataHora() {
        return dataHora;
    }
}