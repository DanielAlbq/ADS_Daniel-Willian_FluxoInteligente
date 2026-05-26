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
}