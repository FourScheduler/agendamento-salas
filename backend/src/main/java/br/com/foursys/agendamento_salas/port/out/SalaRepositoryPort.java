package br.com.foursys.agendamento_salas.port.out;

import br.com.foursys.agendamento_salas.domain.Sala;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Component
public interface SalaRepositoryPort {
    List<Sala> buscarTodas();

    List<Sala> buscarDisoniveis(LocalDate data, LocalTime inicio, LocalTime fim, Integer pessoas);

    Optional<Sala> buscarPorId(Long id);

    /** Busca a sala com lock pessimista, para serializar reservas concorrentes da mesma sala. */
    Optional<Sala> buscarPorIdComBloqueio(Long id);

    Sala salvar(Sala sala);

    boolean existsByNomeIgnoreCase(String nome);
}
