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

        ArquivoComprovante comprovante = new ArquivoComprovante();
        comprovante.setNomeArquivo(arquivo.getOriginalFilename());
        comprovante.setTipoArquivo(mimeType);
        comprovante.setBase64(Base64.getEncoder().encodeToString(arquivo.getBytes()));
        comprovante.setUsuario(getUsuarioLogado());
        comprovante.setTextoExtraido(textoExtraido);

        ArquivoComprovante arquivoSalvo = arquivoRepository.save(comprovante);

        return arquivoSalvo;
    }

    public Map<String, String> extrairDadosInteligentes(String textoBruto) {
        Map<String, String> dadosExtraidos = new HashMap<>();

        if (textoBruto == null || textoBruto.isEmpty()) {
            return dadosExtraidos;
        }

        Matcher mCnpj = Pattern
                .compile("(?i)(?:CNPJ[:\\s]*)?(\\d{2}[\\.\\,]?\\s*\\d{3}[\\.\\,]?\\s*\\d{3}/\\d{4}-\\d{2})")
                .matcher(textoBruto);
        if (mCnpj.find()) {
            String cnpjLimpo = mCnpj.group(1).replaceAll("[\\,\\s]", "").replaceFirst("(\\d{2})(\\d{3})", "$1.$2");
            dadosExtraidos.put("cnpj", cnpjLimpo);
        }

        Matcher mData = Pattern.compile("(?i)(?:Emiss[aã]o[:\\s]*)?(\\d{2}/\\d{2}/(\\d{4}|\\d{2}))")
                .matcher(textoBruto);
        if (mData.find()) {
            String dataEncontrada = mData.group(1);
            if (dataEncontrada.length() == 8) {
                String[] partes = dataEncontrada.split("/");
                dataEncontrada = partes[0] + "/" + partes[1] + "/20" + partes[2];
            }
            dadosExtraidos.put("data", dataEncontrada);
        }

        String[] padroesValor = {
                "(?i)VALOR\\.+:\\s*R\\$\\s*((?!0[.,]00)\\d{1,3}(?:[.,]\\d{3})*[.,]\\d{2})",

                "(?i)VALOR PA[CG]O(?:\\s*\\(R\\$\\)|\\s*R\\$)?(?:[\\s\\r\\n]+)((?!0[.,]00)\\d{1,3}(?:[.,]\\d{3})*[.,]\\d{2})",

                "(?i)(?<!SUB)TOTAL R\\$[\\s\\S]{0,50}?((?!0[.,]00)\\d{1,3}(?:[.,]\\d{3})*[.,]\\d{2})",

                "(?i)(?:(?<!SUB)Valor Total(?: R\\$)?|Valor a Pagar|VALOR TOTAL DA NOTA)[\\s\\S]{0,80}?(?:R\\$\\s*)?((?!0[.,]00)\\d{1,3}(?:[.,]\\d{3})*[.,]\\d{2})"
        };

        for (String regex : padroesValor) {
            Matcher mValor = Pattern.compile(regex).matcher(textoBruto);
            if (mValor.find()) {
                dadosExtraidos.put("valorTotal", mValor.group(1).replace(".", ","));
                break;
            }
        }

        String nomeEncontrado = null;

        Matcher mNomeDanfe = Pattern.compile("(?i)RECEBEMOS DE\\s+([A-Za-zÀ-ÿ0-9\\s\\.\\-\\&]+?)\\s+OS PRODUTOS")
                .matcher(textoBruto);
        Matcher mNomeAbaixoCnpj = Pattern.compile(
                "(?i)CNPJ[^\\r\\n]*?\\d{2}[\\.\\,]?\\d{3}[\\.\\,]?\\d{3}/\\d{4}-\\d{2}[\\r\\n]+([A-Za-zÀ-ÿ][^\\r\\n]{4,50})")
                .matcher(textoBruto);
        Matcher mNomeAntesCnpj = Pattern.compile("(?i)([A-Za-zÀ-ÿ][^\\r\\n]{4,50})[\\r\\n]+[^\\r\\n]*?CNPJ")
                .matcher(textoBruto);

        Matcher mNomePosto = Pattern.compile("(?i)(?:Linx[\\r\\n]+)?([^\\r\\n]*(?:POSTOS?|LTDA)[^\\r\\n]*)")
                .matcher(textoBruto);

        if (mNomeDanfe.find()) {
            nomeEncontrado = mNomeDanfe.group(1);
        } else if (mNomePosto.find()) {
            nomeEncontrado = mNomePosto.group(1);
        } else if (mNomeAbaixoCnpj.find()) {
            nomeEncontrado = mNomeAbaixoCnpj.group(1);
        } else if (mNomeAntesCnpj.find()) {
            nomeEncontrado = mNomeAntesCnpj.group(1);
        }

        if (nomeEncontrado != null) {
            nomeEncontrado = nomeEncontrado
                    .replaceAll("(?i)(N[AÃ]O [EÉ] DOCUMENTO FISCAL|LINX|EXTRATO|DOCUMENTO AUXILIAR|SISTEMA)", "")
                    .trim();

            nomeEncontrado = nomeEncontrado.replaceAll("(?i)(AVENIDA|AV\\.|RUA|ENDERE[CÇ]O|FONE|DOCUMENTO).*$", "")
                    .trim();

            nomeEncontrado = nomeEncontrado.replaceFirst("^[^A-Za-zÀ-ÿ]+", "").trim();

            if (nomeEncontrado.length() > 50) {
                nomeEncontrado = nomeEncontrado.substring(0, 50);
            }

            if (nomeEncontrado.length() >= 4) {
                dadosExtraidos.put("descricao", nomeEncontrado);
            }
        }

        return dadosExtraidos;
    }
}