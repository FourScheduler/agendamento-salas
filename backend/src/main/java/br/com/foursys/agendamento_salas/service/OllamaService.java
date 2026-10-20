package br.com.foursys.agendamento_salas.service;

import br.com.foursys.agendamento_salas.dto.request.OllamaRequest;
import br.com.foursys.agendamento_salas.dto.response.InterpretarAgendamentoResponse;
import br.com.foursys.agendamento_salas.dto.response.OllamaResponse;
import br.com.foursys.agendamento_salas.exception.InterpretacaoIaException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;

@Service
public class OllamaService {

    private final RestClient ollamaRestClient;
    private final String model;
    private final ObjectMapper objectMapper;
    private final int keepAliveSeconds;
    private final int maxOutputTokens;

    public OllamaService(
            RestClient ollamaRestClient,
            @Value("${ollama.model}") String model,
            ObjectMapper objectMapper,
            @Value("${ollama.keep-alive-seconds:-1}") int keepAliveSeconds,
            @Value("${ollama.max-output-tokens:120}") int maxOutputTokens
    ) {
        this.ollamaRestClient = ollamaRestClient;
        this.model = model;
        this.objectMapper = objectMapper;
        this.keepAliveSeconds = keepAliveSeconds;
        this.maxOutputTokens = maxOutputTokens;
    }

    public String gerarResposta(String prompt) {
        Map<String, Object> opcoes = Map.of(
                "num_predict", maxOutputTokens,
                "temperature", 0.1
        );

        Map<String, Object> request = Map.of(
                "model", model,
                "prompt", prompt,
                "stream", false,
                "format", "json",
                "think", false,
                "keep_alive", keepAliveSeconds,
                "options", opcoes
        );

        OllamaResponse response = ollamaRestClient.post()
                .uri("/api/generate")
                .body(request)
                .retrieve()
                .body(OllamaResponse.class);

        if (response == null || response.response() == null) {
            throw new IllegalStateException(
                    "O Ollama retornou uma resposta vazia."
            );
        }

        return response.response();
    }


    public InterpretarAgendamentoResponse interpretarAgendamento(
            String mensagem,
            LocalDate dataConhecida,
            LocalTime inicioConhecido,
            LocalTime fimConhecido,
            Integer quantidadePessoasConhecida,
            String localizacaoConhecida
    ) {

        LocalDate dataAtual = LocalDate.now();

        String contexto = """
                data=%s, inicio=%s, fim=%s, pessoas=%s, local=%s
                """.formatted(
                valorOuNaoInformado(dataConhecida),
                valorOuNaoInformado(inicioConhecido),
                valorOuNaoInformado(fimConhecido),
                valorOuNaoInformado(quantidadePessoasConhecida),
                valorOuNaoInformado(localizacaoConhecida)
        );

        String prompt = """
                Você extrai dados de pedidos de agendamento de salas e responde só em JSON.
                Data atual: %s.

                CONTEXTO JÁ REGISTRADO (não repita esses valores no resultado):
                %s

                Extraia da mensagem atual apenas o que foi informado ou corrigido.
                Cada campo retorna {"valor": <valor ou null>, "informado": <true|false>}.
                Regras:
                - Não informado = valor null e informado false. Nunca invente. Nunca use 00:00.
                - "hoje" = %s; "amanhã" = %s; outras datas relativas use a data atual.
                - Horários: "14h" = "14:00:00", "14h30" = "14:30:00", "14:00" = "14:00:00".
                - Duração ("1h", "1h30", "30 min") = minutos em duracaoMinutos e deixe "fim" null.
                - Horário final explícito ("até 15h") = "fim" e duracaoMinutos null/false.
                - Quantidade por extenso vira número ("cinco" = 5).
                - localização é unidade ou endereço mencionado ("no Centro"), nunca nome de sala.

                Exemplos:
                Mensagem: Quero uma sala dia 20 de outubro às 16h para 3 pessoas no Centro
                {"data":{"valor":"2026-10-20","informado":true},"inicio":{"valor":"16:00:00","informado":true},"fim":{"valor":null,"informado":false},"quantidadePessoas":{"valor":3,"informado":true},"localizacao":{"valor":"Centro","informado":true},"duracaoMinutos":{"valor":null,"informado":false}}
                Mensagem: começa às 9h e dura 1h30
                {"data":{"valor":null,"informado":false},"inicio":{"valor":"09:00:00","informado":true},"fim":{"valor":null,"informado":false},"quantidadePessoas":{"valor":null,"informado":false},"localizacao":{"valor":null,"informado":false},"duracaoMinutos":{"valor":90,"informado":true}}
                Mensagem: pode ser na sala do diretor
                {"data":{"valor":null,"informado":false},"inicio":{"valor":null,"informado":false},"fim":{"valor":null,"informado":false},"quantidadePessoas":{"valor":null,"informado":false},"localizacao":{"valor":null,"informado":false},"duracaoMinutos":{"valor":null,"informado":false}}

                Responda SOMENTE com este JSON, sem markdown:
                {"data":{"valor":null,"informado":false},"inicio":{"valor":null,"informado":false},"fim":{"valor":null,"informado":false},"quantidadePessoas":{"valor":null,"informado":false},"localizacao":{"valor":null,"informado":false},"duracaoMinutos":{"valor":null,"informado":false}}
                Mensagem atual: %s
                """.formatted(
                dataAtual,
                contexto,
                dataAtual,
                dataAtual.plusDays(1),
                mensagem
        );

        try {
            String resposta = gerarResposta(prompt);

            resposta = resposta
                    .replace("```json", "")
                    .replace("```", "")
                    .trim();

            return objectMapper.readValue(
                    resposta,
                    InterpretarAgendamentoResponse.class
            );

        } catch (RestClientException | JacksonException e) {
            throw new InterpretacaoIaException(e);
        }
    }


    private String valorOuNaoInformado(Object valor) {
        return valor == null ? "não informado" : valor.toString();
    }

}
