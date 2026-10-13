package br.com.foursys.agendamento_salas.service;

import br.com.foursys.agendamento_salas.dto.request.OllamaRequest;
import br.com.foursys.agendamento_salas.dto.response.InterpretarAgendamentoResponse;
import br.com.foursys.agendamento_salas.dto.response.OllamaResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.time.LocalTime;

@Service
public class OllamaService {

    private final RestClient ollamaRestClient;
    private final String model;
    private final ObjectMapper objectMapper;

    public OllamaService(RestClient ollamaRestClient, @Value("${ollama.model}") String model, ObjectMapper objectMapper) {
        this.ollamaRestClient = ollamaRestClient;
        this.model = model;
        this.objectMapper = objectMapper;
    }

    public String gerarResposta(String prompt) {

        OllamaRequest request = new OllamaRequest(model, prompt, false);

        OllamaResponse response = ollamaRestClient.post().uri("/api/generate").body(request).retrieve().body(OllamaResponse.class);

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
                Data já conhecida: %s
                Horário inicial já conhecido: %s
                Horário final já conhecido: %s
                Quantidade de pessoas já conhecida: %s
                Localização já conhecida: %s
                """.formatted(
                valorOuNaoInformado(dataConhecida),
                valorOuNaoInformado(inicioConhecido),
                valorOuNaoInformado(fimConhecido),
                valorOuNaoInformado(quantidadePessoasConhecida),
                valorOuNaoInformado(localizacaoConhecida)
        );

        String prompt = """
                Você é um assistente responsável por interpretar pedidos
                de agendamento de salas.
                
                A data atual é %s.
                
                CONTEXTO DA CONVERSA:
                Os valores abaixo já foram registrados pelo sistema.
                Use-os para entender a nova mensagem, mas NÃO os considere
                como informações fornecidas novamente pelo usuário.
                
                %s
                
                SUA TAREFA:
                Interprete somente as informações novas ou corrigidas
                que o usuário forneceu na mensagem atual.
                
                Para cada campo, retorne:
                - valor: o valor extraído da mensagem atual ou null.
                - informado: true se a mensagem atual informou ou corrigiu
                  esse campo; false caso contrário.
                
                REGRA OBRIGATÓRIA:
                Se um campo não foi informado nem corrigido na mensagem atual:
                - valor deve ser null.
                - informado deve ser false.
                - Não copie para o resultado o valor que já estava no contexto.
                - Nunca invente informações.
                - Nunca use 00:00 como substituto para horário ausente.
                
                REGRAS PARA DATAS:
                - Se a mensagem atual disser "hoje", informado deve ser true
                  e valor deve ser %s.
                - Se disser "amanhã", informado deve ser true e valor deve
                  ser a data do dia seguinte a %s.
                - Interprete datas relativas usando a data atual informada.
                - Se não houver uma nova data na mensagem, retorne null
                  e informado false para data.
                
                REGRAS PARA HORÁRIOS:
                - "14h" deve ser convertido para "14:00:00".
                - "14h30" deve ser convertido para "14:30:00".
                - "14:00" deve ser convertido para "14:00:00".
                - Não invente horários.
                - Se a mensagem não informar ou corrigir um horário,
                  retorne null e informado false para esse campo.
                
                REGRAS PARA QUANTIDADE:
                - Converta quantidades escritas por extenso em números.
                - Exemplo: "cinco pessoas" corresponde ao número 5.
                - Não invente quantidades.
                - Se a mensagem não informar ou corrigir a quantidade,
                  retorne null e informado false.
                
                REGRAS PARA LOCALIZAÇÃO:
                - Identifique a localização desejada para a sala,
                  caso ela seja mencionada na mensagem atual.
                - Exemplos: "no Centro", "na unidade Paulista",
                  "perto da recepção".
                - Retorne somente a localização mencionada pelo usuário,
                  sem inventar endereços ou locais.
                - Se o usuário corrigir a localização anterior,
                  retorne a nova localização e informado true.
                - Se nenhuma localização for informada ou corrigida,
                  retorne null e informado false.
                - Não confunda localização com nome de sala.
                
                Retorne SOMENTE JSON válido, sem markdown ou explicações.
                Use exatamente esta estrutura:
                
                {
                  "data": {
                    "valor": null,
                    "informado": false
                  },
                  "inicio": {
                    "valor": null,
                    "informado": false
                  },
                  "fim": {
                    "valor": null,
                    "informado": false
                  },
                  "quantidadePessoas": {
                    "valor": null,
                    "informado": false
                  },
                  "localizacao": {
                    "valor": null,
                    "informado": false
                  }
                }
                
                MENSAGEM ATUAL DO USUÁRIO:
                %s
                """.formatted(
                dataAtual,
                contexto,
                dataAtual,
                dataAtual,
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

        } catch (Exception e) {
            throw new RuntimeException(
                    "Erro ao interpretar agendamento com Ollama",
                    e
            );
        }
    }


    private String valorOuNaoInformado(Object valor) {
        return valor == null ? "não informado" : valor.toString();
    }

}
