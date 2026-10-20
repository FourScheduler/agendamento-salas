package br.com.foursys.agendamento_salas.mapper;

import br.com.foursys.agendamento_salas.domain.Agendamento;
import br.com.foursys.agendamento_salas.dto.response.AgendamentoResponse;
import br.com.foursys.agendamento_salas.dto.response.SalaResponse;
import br.com.foursys.agendamento_salas.dto.response.UsuarioResponse;
import br.com.foursys.agendamento_salas.enums.StatusAgendamento;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import javax.annotation.processing.Generated;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-10-16T08:38:08-0300",
    comments = "version: 1.6.3, compiler: javac, environment: Java 21.0.11 (Azul Systems, Inc.)"
)
@Component
public class AgendamentoMapperImpl implements AgendamentoMapper {

    @Autowired
    private SalaMapper salaMapper;
    @Autowired
    private UsuarioMapper usuarioMapper;

    @Override
    public AgendamentoResponse entityToResponse(Agendamento entity) {
        if ( entity == null ) {
            return null;
        }

        SalaResponse salaId = null;
        LocalDate dataAgendamento = null;
        LocalDateTime dataCriacao = null;
        LocalTime horaInicio = null;
        LocalTime horaFim = null;
        Integer qntdPessoas = null;
        String titulo = null;
        UsuarioResponse usuarioIdSolicitante = null;
        StatusAgendamento status = null;

        salaId = salaMapper.entityToResponse( entity.getSalaId() );
        dataAgendamento = entity.getDataAgendamento();
        dataCriacao = entity.getDataCriacao();
        horaInicio = entity.getHoraInicio();
        horaFim = entity.getHoraFim();
        qntdPessoas = entity.getQntdPessoas();
        titulo = entity.getTitulo();
        usuarioIdSolicitante = usuarioMapper.toResponse( entity.getUsuarioIdSolicitante() );
        status = entity.getStatus();

        AgendamentoResponse agendamentoResponse = new AgendamentoResponse( salaId, dataAgendamento, dataCriacao, horaInicio, horaFim, qntdPessoas, titulo, usuarioIdSolicitante, status );

        return agendamentoResponse;
    }
}
