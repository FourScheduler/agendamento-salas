package br.com.foursys.agendamento_salas.mapper;

import br.com.foursys.agendamento_salas.domain.Agendamento;
import br.com.foursys.agendamento_salas.domain.Sala;
import br.com.foursys.agendamento_salas.domain.Usuario;
import br.com.foursys.agendamento_salas.dto.response.AgendamentoResponse;
import br.com.foursys.agendamento_salas.enums.StatusAgendamento;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-10-13T10:25:24-0300",
    comments = "version: 1.6.3, compiler: javac, environment: Java 21.0.11 (Azul Systems, Inc.)"
)
@Component
public class AgendamentoMapperImpl implements AgendamentoMapper {

    @Override
    public AgendamentoResponse entityToResponse(Agendamento entity) {
        if ( entity == null ) {
            return null;
        }

        Sala salaId = null;
        LocalDate dataAgendamento = null;
        LocalDateTime dataCriacao = null;
        LocalTime horaInicio = null;
        LocalTime horaFim = null;
        Integer qntdPessoas = null;
        String titulo = null;
        Usuario usuarioIdSolicitante = null;
        StatusAgendamento status = null;

        salaId = entity.getSalaId();
        dataAgendamento = entity.getDataAgendamento();
        dataCriacao = entity.getDataCriacao();
        horaInicio = entity.getHoraInicio();
        horaFim = entity.getHoraFim();
        qntdPessoas = entity.getQntdPessoas();
        titulo = entity.getTitulo();
        usuarioIdSolicitante = entity.getUsuarioIdSolicitante();
        status = entity.getStatus();

        AgendamentoResponse agendamentoResponse = new AgendamentoResponse( salaId, dataAgendamento, dataCriacao, horaInicio, horaFim, qntdPessoas, titulo, usuarioIdSolicitante, status );

        return agendamentoResponse;
    }
}
