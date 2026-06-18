package com.fluxointeligente.api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

@Service
public class InsightsService {

    // Variaveis do ollama vindo do application.properties
    @Value("${ollama.url}")
    private String apiUrl;

    @Value("${ollama.model}")
    private String nomeModelo;

    private final RestTemplate restTemplate;

    public InsightsService() {
        this.restTemplate = new RestTemplate();
    }

    public String gerarAnaliseInteligente(String contextoFinanceiro) {
        String prompt = "Você é um consultor financeiro especialista em pequenas empresas. " +
                "Baseado nestes dados: " + contextoFinanceiro + " " +
                "Forneça: 1. Projeção de caixa para 30, 60 e 90 dias. " +
                "2. Alertas sobre possível saldo negativo. " +
                "3. Simulação: 'E se as vendas caírem 20%?'. " +
                "Mantenha a resposta direta.";

        String requestBody = "{\n" +
                "  \"model\": \"" + nomeModelo + "\",\n" +
                "  \"prompt\": \"" + prompt.replace("\"", "\\\"").replace("\n", " ") + "\",\n" +
                "  \"stream\": false\n" +
                "}";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> request = new HttpEntity<>(requestBody, headers);

        try {
            // Chamar o ollama
            ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, request, String.class);
            return extrairTextoDaResposta(response.getBody());
        } catch (Exception e) {
            System.err.println("Erro ao chamar Ollama local: " + e.getMessage());
            return "Não foi possível gerar os insights neste momento. Verifique se o Ollama está rodando.";
        }
    }

    private String extrairTextoDaResposta(String jsonResponse) {
        try {
            // trazer a resposta do ollama
            java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("\"response\"\\s*:\\s*\"(.*?)\"")
                    .matcher(jsonResponse.replaceAll("\\s+", " "));
            if (matcher.find()) {
                // ajeitar as quebras de linha
                return matcher.group(1).replace("\\n", "\n").replace("\\\"", "\"");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "Insight gerado, mas ocorreu um erro ao ler a resposta do servidor local.";
    }
}