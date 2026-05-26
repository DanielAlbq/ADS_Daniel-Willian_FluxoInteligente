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

            Map<String, String> resposta = new HashMap<>();
            resposta.put("idArquivo", arquivoSalvo.getId().toString());

            resposta.put("textoLido", arquivoSalvo.getTextoExtraido());

            return ResponseEntity.ok(resposta);

        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> erro = new HashMap<>();
            erro.put("erro", "Falha ao processar o arquivo: " + e.getMessage());
            return ResponseEntity.internalServerError().body(erro);
        }
    }
}