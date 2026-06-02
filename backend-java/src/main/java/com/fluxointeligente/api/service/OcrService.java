package com.fluxointeligente.api.service;

import com.fluxointeligente.api.models.ArquivoComprovante;
import com.fluxointeligente.api.models.Usuario;
import com.fluxointeligente.api.repositories.ArquivoComprovanteRepository;
import com.fluxointeligente.api.repositories.UsuarioRepository;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.vision.v1.*;
import com.google.protobuf.ByteString;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.Base64;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.Map;
import java.util.HashMap;

@Service
public class OcrService {

    @Autowired
    private ArquivoComprovanteRepository arquivoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // Pegamos o usuário logado para amarrar ao arquivo
    private Usuario getUsuarioLogado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String emailLogado = (String) auth.getPrincipal();
        return usuarioRepository.findByEmail(emailLogado)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    }

    public ArquivoComprovante processarESalvarArquivo(MultipartFile arquivo) throws Exception {
        String mimeType = arquivo.getContentType();
        String textoExtraido = "";
        ByteString fileBytes = ByteString.readFrom(arquivo.getInputStream());

        // Configurar as Credenciais
        InputStream credentialsStream = new ClassPathResource("google-credentials.json").getInputStream();
        GoogleCredentials credentials = GoogleCredentials.fromStream(credentialsStream);
        ImageAnnotatorSettings settings = ImageAnnotatorSettings.newBuilder()
                .setCredentialsProvider(() -> credentials).build();

        // Abre a conexão com o Google
        try (ImageAnnotatorClient client = ImageAnnotatorClient.create(settings)) {

            Feature feat = Feature.newBuilder().setType(Feature.Type.DOCUMENT_TEXT_DETECTION).build();

            if (mimeType != null && mimeType.contains("pdf")) {

                // Rota PDF
                AnnotateFileRequest fileRequest = AnnotateFileRequest.newBuilder()
                        .setInputConfig(
                                InputConfig.newBuilder().setMimeType("application/pdf").setContent(fileBytes).build())
                        .addFeatures(feat).build();

                BatchAnnotateFilesResponse response = client.batchAnnotateFiles(List.of(fileRequest));

                StringBuilder pdfText = new StringBuilder();

                for (AnnotateFileResponse fileResponse : response.getResponsesList()) {
                    for (AnnotateImageResponse res : fileResponse.getResponsesList()) {

                        if (res.hasError()) {
                            System.out.println("Erro na página do PDF: " + res.getError().getMessage());
                            continue;
                        }

                        if (res.hasFullTextAnnotation()) {
                            pdfText.append(res.getFullTextAnnotation().getText()).append("\n");
                        } else if (res.getTextAnnotationsCount() > 0) {
                            pdfText.append(res.getTextAnnotationsList().get(0).getDescription()).append("\n");
                        }
                    }
                }
                textoExtraido = pdfText.toString().trim();

            } else {
                // Rota Imagem (JPG, PNG)
                Image img = Image.newBuilder().setContent(fileBytes).build();
                AnnotateImageRequest imgRequest = AnnotateImageRequest.newBuilder()
                        .addFeatures(feat).setImage(img).build();

                BatchAnnotateImagesResponse response = client.batchAnnotateImages(List.of(imgRequest));
                for (AnnotateImageResponse res : response.getResponsesList()) {
                    if (res.hasFullTextAnnotation()) {
                        textoExtraido = res.getFullTextAnnotation().getText();
                        break;
                    } else if (res.getTextAnnotationsCount() > 0) {
                        textoExtraido = res.getTextAnnotationsList().get(0).getDescription();
                        break;
                    }
                }
            }
        }

        if (textoExtraido.isEmpty()) {
            textoExtraido = "Nenhum texto encontrado no documento.";
        }

        // Salvar Base64 no Banco de Dados
        ArquivoComprovante comprovante = new ArquivoComprovante();
        comprovante.setNomeArquivo(arquivo.getOriginalFilename());
        comprovante.setTipoArquivo(mimeType);
        // Converte os bytes originais para Base64
        comprovante.setBase64(Base64.getEncoder().encodeToString(arquivo.getBytes()));
        comprovante.setUsuario(getUsuarioLogado());

        ArquivoComprovante arquivoSalvo = arquivoRepository.save(comprovante);

        arquivoSalvo.setTextoExtraido(textoExtraido);

        return arquivoSalvo;
    }

    public Map<String, String> extrairDadosInteligentes(String textoBruto) {
        Map<String, String> dadosExtraidos = new HashMap<>();

        if (textoBruto == null || textoBruto.isEmpty()) {
            return dadosExtraidos;
        }

        // 1. Padrão CNPJ (Funciona perfeitamente)
        Matcher mCnpj = Pattern.compile("\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}").matcher(textoBruto);
        if (mCnpj.find()) {
            dadosExtraidos.put("cnpj", mCnpj.group());
        }

        // 2. Padrão Data: Pega a primeira data válida no formato DD/MM/YYYY
        Matcher mData = Pattern.compile("\\d{2}/\\d{2}/\\d{4}").matcher(textoBruto);
        if (mData.find()) {
            dadosExtraidos.put("data", mData.group());
        }

        // 3. Padrão Valor Total da DANFE: Procura "VALOR TOTAL DA NOTA" e pega o
        // próximo número com vírgula
        // O (?i) ignora maiúsculas/minúsculas. O [\\s\\S]*? permite pular quebras de
        // linha até achar o valor.
        Matcher mValor = Pattern.compile(
                "(?i)(?:VALOR TOTAL DA NOTA|VALOR TOTAL(?: R\\$)?|VALOR PAGO)[\\s\\S]{0,80}?(?:R\\$\\s*)?((?!0,00)\\d{1,3}(?:\\.\\d{3})*,\\d{2})")
                .matcher(textoBruto);
        if (mValor.find()) {
            dadosExtraidos.put("valorTotal", mValor.group(1));
        }

        // 4. Padrão Descrição (Nome do Estabelecimento - Estratégia em Cascata)

        // Tentativa A: Canhoto da DANFE
        Matcher mNomeDanfe = Pattern.compile("(?i)RECEBEMOS DE\\s+([A-Za-z0-9\\s\\.\\-\\&]+?)\\s+OS PRODUTOS")
                .matcher(textoBruto);

        // Tentativa B: Cupom Fiscal (NFC-e). Pega tudo que estiver antes da primeira
        // aparição da palavra "CNPJ"
        Matcher mNomeNfce = Pattern.compile("(?i)(?:NFC-e|Extrato)?\\s*(.+?)\\s+CNPJ").matcher(textoBruto);

        // Tentativa C: DANFE sem canhoto
        Matcher mNomeAlternativo = Pattern.compile("(?i)NOME\\s*/\\s*RAZ[AÃ]O SOCIAL[\\r\\n]+([^\\r\\n0-9]+)")
                .matcher(textoBruto);

        String nomeEncontrado = null;

        if (mNomeDanfe.find()) {
            nomeEncontrado = mNomeDanfe.group(1);
        } else if (mNomeNfce.find()) {
            // Remove lixos como "NFC-e " do começo do nome que capturamos
            nomeEncontrado = mNomeNfce.group(1).replaceAll("(?i)^NFC-e\\s*", "");
        } else if (mNomeAlternativo.find()) {
            nomeEncontrado = mNomeAlternativo.group(1);
        }

        if (nomeEncontrado != null) {
            nomeEncontrado = nomeEncontrado.trim();
            if (nomeEncontrado.length() > 50) {
                nomeEncontrado = nomeEncontrado.substring(0, 50);
            }
            dadosExtraidos.put("descricao", nomeEncontrado);
        }

        return dadosExtraidos;
    }
}