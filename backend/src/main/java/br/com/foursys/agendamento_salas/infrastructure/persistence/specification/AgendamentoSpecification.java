package br.com.foursys.agendamento_salas.infrastructure.persistence.specification;

import br.com.foursys.agendamento_salas.domain.Agendamento;
import br.com.foursys.agendamento_salas.enums.StatusAgendamento;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class AgendamentoSpecification {
    public static Specification<Agendamento> filtros(
            Long usuarioId,
            LocalDate dataInicio,
            LocalDate dataFim,
            StatusAgendamento status) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (usuarioId != null) {
                predicates.add(
                        cb.equal(root.get("usuarioId").get("id"), usuarioId)
                );
            }

            if (dataInicio != null) {
                predicates.add(
                        cb.greaterThanOrEqualTo(
                                root.get("dataAgendamento"), dataInicio)
                );
            }

            if (dataFim != null) {
                predicates.add(
                        cb.lessThanOrEqualTo(
                                root.get("dataAgendamento"), dataFim)
                );
            }

            if (status != null) {
                predicates.add(
                        cb.equal(root.get("status"), status)
                );
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
