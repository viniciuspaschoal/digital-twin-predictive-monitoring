package com.unisal.predictdt.service;

import com.unisal.predictdt.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.UUID;

@Service
public class Modelo3DStorageService {

    /*
     * Pasta onde os arquivos GLB serão salvos.
     *
     * Pode ser configurado no application-dev.properties:
     * predictdt.storage.modelo3d.base-path=storage/modelos-3d
     */
    @Value("${predictdt.storage.modelo3d.base-path:storage/modelos-3d}")
    private String basePath;

    /*
     * Tamanho máximo permitido para o arquivo.
     *
     * Valor padrão: 100 MB.
     *
     * Pode ser configurado:
     * predictdt.storage.modelo3d.max-size-bytes=104857600
     */
    @Value("${predictdt.storage.modelo3d.max-size-bytes:104857600}")
    private Long maxSizeBytes;

    /*
     * Salva o arquivo GLB/GLTF em storage local.
     *
     * O nome físico do arquivo é gerado pelo backend para evitar:
     * - conflito de nomes;
     * - path traversal;
     * - uso inseguro do nome original.
     */
    public ArquivoModelo3DSalvo salvarArquivo(MultipartFile file) {
        validarArquivo(file);

        String nomeOriginal = limparNomeOriginal(file.getOriginalFilename());
        String extensao = extrairExtensao(nomeOriginal);
        String nomeArquivoStorage = UUID.randomUUID() + extensao;

        try {
            Path diretorio = getDiretorioBase();
            Files.createDirectories(diretorio);

            Path caminhoDestino = diretorio.resolve(nomeArquivoStorage).normalize();

            /*
             * Garante que o arquivo final continua dentro da pasta base.
             * Isso protege contra path traversal.
             */
            if (!caminhoDestino.startsWith(diretorio)) {
                throw new BusinessException(
                        HttpStatus.BAD_REQUEST,
                        "Caminho de arquivo inválido"
                );
            }

            Files.copy(file.getInputStream(), caminhoDestino);

            return new ArquivoModelo3DSalvo(
                    caminhoDestino.toString(),
                    definirContentType(extensao, file.getContentType()),
                    file.getSize(),
                    nomeOriginal
            );
        } catch (IOException ex) {
            throw new BusinessException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Erro ao salvar arquivo do modelo 3D"
            );
        }
    }

    /*
     * Carrega o arquivo salvo para ser retornado pela API.
     */
    public Resource carregarArquivo(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) {
            throw new BusinessException(
                    HttpStatus.NOT_FOUND,
                    "Arquivo do modelo 3D não encontrado"
            );
        }

        Path caminhoArquivo = Path.of(storagePath).normalize();

        if (!Files.exists(caminhoArquivo) || !Files.isRegularFile(caminhoArquivo)) {
            throw new BusinessException(
                    HttpStatus.NOT_FOUND,
                    "Arquivo do modelo 3D não encontrado no storage"
            );
        }

        return new FileSystemResource(caminhoArquivo);
    }

    /*
     * Define o content-type usado no retorno do arquivo.
     */
    public String definirContentTypePorStoragePath(String storagePath) {
        String extensao = extrairExtensao(storagePath);

        return definirContentType(extensao, null);
    }

    private void validarArquivo(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "O arquivo do modelo 3D deve ser informado"
            );
        }

        if (file.getSize() > maxSizeBytes) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "O arquivo do modelo 3D excede o tamanho máximo permitido"
            );
        }

        String nomeOriginal = limparNomeOriginal(file.getOriginalFilename());
        String extensao = extrairExtensao(nomeOriginal);

        if (!".glb".equals(extensao) && !".gltf".equals(extensao)) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "Formato inválido. São permitidos apenas arquivos .glb ou .gltf"
            );
        }
    }

    private Path getDiretorioBase() {
        return Path.of(basePath).toAbsolutePath().normalize();
    }

    private String limparNomeOriginal(String nomeOriginal) {
        if (nomeOriginal == null || nomeOriginal.isBlank()) {
            return "modelo-3d.glb";
        }

        return Path.of(nomeOriginal).getFileName().toString();
    }

    private String extrairExtensao(String nomeArquivo) {
        int index = nomeArquivo.lastIndexOf(".");

        if (index < 0) {
            return "";
        }

        return nomeArquivo.substring(index).toLowerCase(Locale.ROOT);
    }

    private String definirContentType(String extensao, String contentTypeOriginal) {
        if (".glb".equals(extensao)) {
            return "model/gltf-binary";
        }

        if (".gltf".equals(extensao)) {
            return "model/gltf+json";
        }

        if (contentTypeOriginal != null && !contentTypeOriginal.isBlank()) {
            return contentTypeOriginal;
        }

        return "application/octet-stream";
    }

    /*
     * Resultado interno do salvamento do arquivo.
     *
     * Esse record será usado pelo Modelo3DService para salvar os metadados no banco.
     */
    public record ArquivoModelo3DSalvo(
            String storagePath,
            String contentType,
            Long fileSize,
            String nomeOriginalArquivo
    ) {
    }
}