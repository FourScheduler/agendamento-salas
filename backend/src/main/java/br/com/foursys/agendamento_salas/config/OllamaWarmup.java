package br.com.foursys.agendamento_salas.config;

import br.com.foursys.agendamento_salas.service.OllamaService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Mantém o modelo do Ollama carregado desde a subida da aplicação,
 * evitando que a primeira mensagem do usuário pague o tempo de carga.
 * Roda em background para não atrasar o startup.
 */
@Component
@ConditionalOnProperty(
        name = "ollama.warmup.enabled",
        havingValue = "true",
        matchIfMissing = true
)
public class OllamaWarmup implements ApplicationRunner {

    private static final Logger log =
            LoggerFactory.getLogger(OllamaWarmup.class);

    private final OllamaService ollamaService;

    public OllamaWarmup(OllamaService ollamaService) {
        this.ollamaService = ollamaService;
    }

    @Override
    public void run(ApplicationArguments args) {
        Thread.startVirtualThread(() -> {
            try {
                ollamaService.gerarResposta("{}");
                log.info("Modelo do Ollama carregado e pronto.");
            } catch (Exception e) {
                log.warn(
                        "Warm-up do Ollama falhou (o modelo segue indisponível até o primeiro pedido): {}",
                        e.getMessage()
                );
            }
        });
    }
}
