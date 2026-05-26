package com.fluxointeligente.api.service;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.vision.v1.*;
import com.google.protobuf.ByteString;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
public class OcrService {

    public String extrairTextoDaImagem(MultipartFile arquivo) throws Exception {

        // 1. pega as credenciais do json
        InputStream credentialsStream = new ClassPathResource("google-credentials.json").getInputStream();
        GoogleCredentials credentials = GoogleCredentials.fromStream(credentialsStream);

        ImageAnnotatorSettings settings = ImageAnnotatorSettings.newBuilder()
                .setCredentialsProvider(() -> credentials)
                .build();

        // 2. Abre a conexão com o Google
        try (ImageAnnotatorClient client = ImageAnnotatorClient.create(settings)) {

            // 3. Transforma o arquivo em bytes para enviar
            ByteString imgBytes = ByteString.readFrom(arquivo.getInputStream());
            Image img = Image.newBuilder().setContent(imgBytes).build();

            // 4. Configura para DETECÇÃO DE TEXTO
            Feature feat = Feature.newBuilder().setType(Feature.Type.TEXT_DETECTION).build();
            AnnotateImageRequest request = AnnotateImageRequest.newBuilder()
                    .addFeatures(feat)
                    .setImage(img)
                    .build();

            List<AnnotateImageRequest> requests = new ArrayList<>();
            requests.add(request);

            // 5. Envia para a nuvem
            BatchAnnotateImagesResponse response = client.batchAnnotateImages(requests);
            List<AnnotateImageResponse> responses = response.getResponsesList();

            // 6. Lê a resposta
            for (AnnotateImageResponse res : responses) {
                if (res.hasError()) {
                    throw new Exception("Erro do Google Cloud Vision: " + res.getError().getMessage());
                }

                if (res.getTextAnnotationsCount() > 0) {
                    return res.getTextAnnotationsList().get(0).getDescription();
                }
            }

            return "Nenhum texto encontrado na imagem.";
        }
    }
}