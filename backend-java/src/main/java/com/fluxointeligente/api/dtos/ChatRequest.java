package com.fluxointeligente.api.dtos;

public class ChatRequest {
    private String mensagem;

    public ChatRequest() {
    }

    public String getMensagem() {
        return mensagem;
    }

    public void setMensagem(String mensagem) {
        this.mensagem = mensagem;
    }
}
