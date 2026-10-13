package br.com.foursys.agendamento_salas.domain;

import br.com.foursys.agendamento_salas.enums.StatusAgendamento;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Builder
@Getter
@Setter
@Entity
@Table(name = "agendamento_conversas")
@NoArgsConstructor
@AllArgsConstructor
public class AgendamentoConversa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuarioId;

    @Enumerated(EnumType.STRING)
    private StatusAgendamento status;

    private LocalDate dataAgendamento;
    private LocalTime horaInicio;
    private LocalTime horaFim;
    private Integer qntdPessoas;

    @ManyToOne
    @JoinColumn(name = "sala_id", nullable = true)
    private Sala salaEscolhida;

    private String titulo;

    private String localizacao;
}
