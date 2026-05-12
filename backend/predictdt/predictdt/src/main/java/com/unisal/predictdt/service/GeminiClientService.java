package com.unisal.predictdt.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GeminiClientService {

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String model;

    @Value("${gemini.base-url:https://generativelanguage.googleapis.com/v1beta/models}")
    private String baseUrl;

    /*
     * Envia um prompt textual para a API do Gemini e retorna o texto gerado.
     *
     * Este service fica isolado para evitar que regras de negócio do sistema
     * dependam diretamente de detalhes da API externa.
     */
    public String gerarTexto(String prompt) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("API key do Gemini não configurada.");
        }

        RestClient restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();

        GeminiRequest request = new GeminiRequest(
                List.of(
                        new Content(
                                "user",
                                List.of(new Part(prompt))
                        )
                ),
                new GenerationConfig(
                        0.3,
                        1500
                )
        );

        GeminiResponse response = restClient.post()
                .uri("/{model}:generateContent", model)
                .header("x-goog-api-key", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(GeminiResponse.class);

        if (response == null ||
                response.candidates() == null ||
                response.candidates().isEmpty() ||
                response.candidates().get(0).content() == null ||
                response.candidates().get(0).content().parts() == null ||
                response.candidates().get(0).content().parts().isEmpty()) {
            throw new IllegalStateException("Gemini não retornou texto válido.");
        }

        return response.candidates()
                .get(0)
                .content()
                .parts()
                .stream()
                .map(PartResponse::text)
                .filter(text -> text != null && !text.isBlank())
                .reduce("", (acc, text) -> acc + text)
                .trim();
    }

    public record GeminiRequest(
            List<Content> contents,
            GenerationConfig generationConfig
    ) {
    }

    public record Content(
            String role,
            List<Part> parts
    ) {
    }

    public record Part(
            String text
    ) {
    }

    public record GenerationConfig(
            Double temperature,
            Integer maxOutputTokens
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GeminiResponse(
            List<Candidate> candidates
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Candidate(
            ContentResponse content
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ContentResponse(
            List<PartResponse> parts
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PartResponse(
            String text
    ) {
    }
}