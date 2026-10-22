package br.com.foursys.agendamento_salas.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@Getter
@Entity
@Table(name = "salas")
@NoArgsConstructor
@AllArgsConstructor
public class Sala {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nome;
    private Boolean disponivel;
    private Integer capacidade;
    private String localizacao;
    /**
     * Salas restritas (Arena) são de reserva de eventos: sem capacidade
     * definida e reserváveis apenas pelo perfil ADMIN.
     */
    @Builder.Default
    private Boolean restrito = false;
}
