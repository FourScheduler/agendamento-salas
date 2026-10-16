package br.com.foursys.agendamento_salas.mapper;

import br.com.foursys.agendamento_salas.domain.Sala;
import br.com.foursys.agendamento_salas.dto.response.SalaResponse;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-10-16T08:38:08-0300",
    comments = "version: 1.6.3, compiler: javac, environment: Java 21.0.11 (Azul Systems, Inc.)"
)
@Component
public class SalaMapperImpl implements SalaMapper {

    @Override
    public SalaResponse entityToResponse(Sala entity) {
        if ( entity == null ) {
            return null;
        }

        SalaResponse.SalaResponseBuilder salaResponse = SalaResponse.builder();

        salaResponse.id( entity.getId() );
        salaResponse.nome( entity.getNome() );
        salaResponse.disponivel( entity.getDisponivel() );
        salaResponse.capacidade( entity.getCapacidade() );
        salaResponse.localizacao( entity.getLocalizacao() );

        return salaResponse.build();
    }
}
