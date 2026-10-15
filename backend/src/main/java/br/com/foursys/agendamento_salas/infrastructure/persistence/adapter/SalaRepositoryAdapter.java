package br.com.foursys.agendamento_salas.infrastructure.persistence.adapter;

import br.com.foursys.agendamento_salas.domain.Sala;
import br.com.foursys.agendamento_salas.infrastructure.persistence.repository.SalaJpaRepository;
import br.com.foursys.agendamento_salas.port.out.SalaRepositoryPort;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Component
public class SalaRepositoryAdapter implements SalaRepositoryPort {
    private final SalaJpaRepository salaJpaRepository;

    public SalaRepositoryAdapter(SalaJpaRepository salaJpaRepository) {
        this.salaJpaRepository = salaJpaRepository;
    }

    @Override
    public List<Sala> buscarTodas() {
        return salaJpaRepository.findAll();
    }

    @Override
    public List<Sala> buscarDisoniveis(LocalDate data, LocalTime inicio, LocalTime fim, Integer pessoas) {
        return salaJpaRepository.buscarSalasDisponiveis(data,inicio,fim,pessoas);
    }

    @Override
    public Optional<Sala> buscarPorId(Long id) {
        return salaJpaRepository.findById(id);
    }

    @Override
    public Optional<Sala> buscarPorIdComBloqueio(Long id) {
        return salaJpaRepository.buscarComBloqueio(id);
    }

    @Override
    public Sala salvar(Sala sala) {
        return salaJpaRepository.save(sala);
    }

    @Override
    public boolean existsByNomeIgnoreCase(String nome) {
        return salaJpaRepository.existsByNomeIgnoreCase(nome);
    }

}
