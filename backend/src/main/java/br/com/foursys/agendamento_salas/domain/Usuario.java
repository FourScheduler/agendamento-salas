package br.com.foursys.agendamento_salas.domain;

import br.com.foursys.agendamento_salas.enums.PerfilUsuario;
import jakarta.persistence.*;
import lombok.*;

@Builder
@Entity
@Table(name = "usuarios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String email;
    private String nome;
    private String password;
    @Enumerated(EnumType.STRING)
    private PerfilUsuario perfilUsuario;
}