package com.fluxointeligente.api.controllers;

import com.fluxointeligente.api.models.ArquivoComprovante;
import com.fluxointeligente.api.service.OcrService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/ocr")
public class OcrController {

    @Autowired
    private OcrService ocrService;

    @PostMapping("/ler-nota")
    public ResponseEntity<Map<String, String>> lerNotaFiscal(@RequestParam("file") MultipartFile file) {
        try {
            ArquivoComprovante arquivoSalvo = ocrService.processarESalvarArquivo(file);
            String textoBruto = arquivoSalvo.getTextoExtraido();

            Map<String, String> dadosInteligentes = ocrService.extrairDadosInteligentes(textoBruto);

            Map<String, String> resposta = new HashMap<>();
            resposta.put("idArquivo", arquivoSalvo.getId().toString());
            resposta.put("textoLido", textoBruto);

            if (dadosInteligentes.containsKey("cnpj")) {
                resposta.put("cnpj", dadosInteligentes.get("cnpj"));
            }
            if (dadosInteligentes.containsKey("data")) {
                resposta.put("data", dadosInteligentes.get("data"));
            }
            if (dadosInteligentes.containsKey("valorTotal")) {
                resposta.put("valorTotal", dadosInteligentes.get("valorTotal"));
            }
            if (dadosInteligentes.containsKey("descricao")) {
                resposta.put("descricao", dadosInteligentes.get("descricao"));
            }

            return ResponseEntity.ok(resposta);

        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> erro = new HashMap<>();
            erro.put("erro", "Falha ao processar o arquivo: " + e.getMessage());
            return ResponseEntity.internalServerError().body(erro);
        }
    }
}