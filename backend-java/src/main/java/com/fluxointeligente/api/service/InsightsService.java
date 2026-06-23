package com.fluxointeligente.api.service;

import com.fluxointeligente.api.models.MensagemChat;
import com.fluxointeligente.api.models.Usuario;
import com.fluxointeligente.api.repositories.MensagemChatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class InsightsService {

    @Value("${ollama.url}")
    private String apiUrl;

    @Value("${ollama.model}")
    private String nomeModelo;

    @Autowired
    private MensagemChatRepository mensagemChatRepository;

    private final RestTemplate restTemplate;

    public InsightsService() {
        this.restTemplate = new RestTemplate();
    }

    public String gerarAnaliseInteligente(String contextoFinanceiro) {
        List<Map<String, String>> mensagens = new ArrayList<>();

        mensagens.add(criarMensagem("system",
                "Você é um Consultor Financeiro Virtual. REGRA ABSOLUTA: Responda apenas sobre finanças de pequenas empresas."));
        mensagens.add(criarMensagem("user", "Meus dados atuais: " + contextoFinanceiro
                + ". Gere um diagnóstico atual, projeção para 30/60/90 dias e alertas de risco. Seja direto em tópicos."));

        return chamarOllamaAPI(mensagens);
    }

    public String conversarComConsultor(Usuario usuarioLogado, String contextoFinanceiro, String mensagemUsuario) {

        MensagemChat novaPergunta = new MensagemChat(usuarioLogado, "USUARIO", mensagemUsuario, LocalDateTime.now());
        mensagemChatRepository.save(novaPergunta);

        List<MensagemChat> historico = mensagemChatRepository
                .findTop4ByUsuarioIdUsuarioOrderByDataHoraDesc(usuarioLogado.getIdUsuario());

        Collections.reverse(historico);

        List<Map<String, String>> mensagens = new ArrayList<>();

        String promptSistema = "Você é o assistente virtual do Fluxo Inteligente. " +
                "DADOS FINANCEIROS ATUAIS DO CLIENTE: " + contextoFinanceiro + ". " +
                "REGRA 1: Responda de forma natural APENAS à última mensagem do usuário. " +
                "REGRA 2: Se a última mensagem for apenas um 'Olá' ou cumprimento, responda APENAS com um cumprimento e pergunte como pode ajudar, sem fazer cálculos. "
                +
                "REGRA 3: Jamais fale sobre política, saúde ou assuntos não-financeiros.";
        mensagens.add(criarMensagem("system", promptSistema));

        for (MensagemChat msg : historico) {
            if (msg.getTexto() != null && !msg.getTexto().trim().isEmpty()) {
                String role = msg.getRemetente().equals("USUARIO") ? "user" : "assistant";
                mensagens.add(criarMensagem(role, msg.getTexto()));
            }
        }

        String respostaIA = chamarOllamaAPI(mensagens);

        if (respostaIA != null && !respostaIA.trim().isEmpty() && !respostaIA.startsWith("Erro")) {
            MensagemChat novaResposta = new MensagemChat(usuarioLogado, "IA", respostaIA, LocalDateTime.now());
            mensagemChatRepository.save(novaResposta);
        } else {
            System.err.println(
                    "A IA retornou vazio ou erro. A mensagem NÃO foi salva no histórico para não poluir o banco.");
        }

        return respostaIA;
    }

    private Map<String, String> criarMensagem(String role, String content) {
        Map<String, String> msg = new HashMap<>();
        msg.put("role", role);
        msg.put("content", content);
        return msg;
    }

    private String chamarOllamaAPI(List<Map<String, String>> mensagens) {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", nomeModelo);
        requestBody.put("messages", mensagens);
        requestBody.put("stream", false);

        Map<String, Object> options = new HashMap<>();
        options.put("num_predict", 1500);
        options.put("num_ctx", 8192);
        requestBody.put("options", options);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, request, Map.class);

            // A API de Chat retorna a resposta dentro do objeto "message"
            if (response.getBody() != null && response.getBody().containsKey("message")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> messageMap = (Map<String, Object>) response.getBody().get("message");
                return messageMap.get("content").toString();
            }
            return "Erro: O campo de resposta da IA não foi encontrado.";

        } catch (Exception e) {
            System.err.println("Erro ao chamar Ollama Chat: " + e.getMessage());
            return "Não foi possível gerar a resposta. Verifique se a URL no application.properties mudou para /api/chat.";
        }
    }
}