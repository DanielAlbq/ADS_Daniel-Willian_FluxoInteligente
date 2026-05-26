package com.fluxointeligente.api.controllers;

import com.fluxointeligente.api.service.OcrService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/ocr")
public class OcrController {

    @Autowired
    private OcrService ocrService;

    @PostMapping("/ler-nota")
    public ResponseEntity<String> lerNotaFiscal(@RequestParam("file") MultipartFile file) {
        try {
            // Repassa o arquivo para o Service
            String textoExtraido = ocrService.extrairTextoDaImagem(file);
            return ResponseEntity.ok(textoExtraido);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Erro ao processar a imagem: " + e.getMessage());
        }
    }
}