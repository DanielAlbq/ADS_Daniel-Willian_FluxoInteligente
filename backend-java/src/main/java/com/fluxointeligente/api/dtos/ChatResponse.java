package com.fluxointeligente.api.dtos;

public class ChatResponse {
    private String resposta;

    public ChatResponse(String resposta) {
        this.resposta = resposta;
    }

    public String getResposta() {
        return resposta;
    }

    public void setResposta(String resposta) {
        this.resposta = resposta;
    }
}