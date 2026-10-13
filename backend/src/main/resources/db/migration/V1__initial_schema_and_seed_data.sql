
-- ============================================
-- V1 - ESTRUTURA INICIAL DO SISTEMA
-- ============================================

-- USUARIOS
CREATE TABLE usuarios (
                          id BIGINT NOT NULL AUTO_INCREMENT,
                          email VARCHAR(255) NOT NULL,
                          password VARCHAR(255) NOT NULL,
                          perfil_usuario VARCHAR(50) NOT NULL,
                          nome VARCHAR(255) NOT NULL,

                          PRIMARY KEY (id),
                          CONSTRAINT uk_usuarios_email UNIQUE (email)
);

-- SALAS
CREATE TABLE salas (
                       id BIGINT NOT NULL AUTO_INCREMENT,
                       disponivel BOOLEAN NOT NULL,
                       capacidade INT NOT NULL,
                       localizacao VARCHAR(255) NOT NULL,
                       nome VARCHAR(255) NOT NULL,

                       PRIMARY KEY (id)
);

-- AGENDAMENTOS
CREATE TABLE agendamentos (
                              id BIGINT NOT NULL AUTO_INCREMENT,
                              usuario_id BIGINT NOT NULL,
                              sala_id BIGINT NOT NULL,
                              data_agendamento DATE NOT NULL,
                              hora_inicio TIME NOT NULL,
                              hora_fim TIME NOT NULL,
                              qntd_pessoas INT NOT NULL,
                              titulo VARCHAR(255) NULL,
                              usuario_id_solicitante BIGINT NULL,
                              status VARCHAR(50) NOT NULL,
                              ultima_atualizacao DATETIME NOT NULL,
                              data_criacao DATETIME NOT NULL,
                              data_cancelamento TIMESTAMP NULL,

                              PRIMARY KEY (id),

                              CONSTRAINT fk_agendamento_usuario
                                  FOREIGN KEY (usuario_id)
                                      REFERENCES usuarios(id),

                              CONSTRAINT fk_agendamento_sala
                                  FOREIGN KEY (sala_id)
                                      REFERENCES salas(id),

                              CONSTRAINT fk_agendamento_usuario_solicitante
                                  FOREIGN KEY (usuario_id_solicitante)
                                      REFERENCES usuarios(id)
);

-- LOGS
CREATE TABLE logs (
                      id BIGINT NOT NULL AUTO_INCREMENT,
                      agendamento_id BIGINT NOT NULL,
                      usuario_id BIGINT NOT NULL,
                      status VARCHAR(30) NOT NULL,
                      data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

                      PRIMARY KEY (id),

                      CONSTRAINT fk_logs_agendamentos
                          FOREIGN KEY (agendamento_id)
                              REFERENCES agendamentos(id),

                      CONSTRAINT fk_logs_usuarios
                          FOREIGN KEY (usuario_id)
                              REFERENCES usuarios(id)
);

-- CONVERSAS DE AGENDAMENTO
CREATE TABLE agendamento_conversas (
                                       id BIGINT NOT NULL AUTO_INCREMENT,
                                       usuario_id BIGINT NOT NULL,
                                       status VARCHAR(50) NOT NULL,
                                       data_agendamento DATE NULL,
                                       hora_inicio TIME NULL,
                                       hora_fim TIME NULL,
                                       qntd_pessoas INT NULL,
                                       sala_id BIGINT NULL,
                                       titulo VARCHAR(255) NULL,
                                       localizacao VARCHAR(255) NULL,

                                       PRIMARY KEY (id),

                                       CONSTRAINT fk_agendamento_conversas_usuario
                                           FOREIGN KEY (usuario_id)
                                               REFERENCES usuarios(id),

                                       CONSTRAINT fk_agendamento_conversas_sala
                                           FOREIGN KEY (sala_id)
                                               REFERENCES salas(id)
);

-- ============================================
-- USUARIOS DE TESTE
-- Senhas armazenadas com BCrypt
-- ============================================

INSERT INTO usuarios (id, nome, email, password, perfil_usuario)
VALUES
    (
        1,
        'Administrador Principal',
        'admin@teste.com',
        '$2a$10$fKio.kNawuO0OqiJqT9UEueguc01EHs8CHMJasO5phgql0jw8XuHG',
        'ADMIN'
    ),
    (
        2,
        'Administradora Secundaria',
        'admin2@teste.com',
        '$2a$10$fKio.kNawuO0OqiJqT9UEueguc01EHs8CHMJasO5phgql0jw8XuHG',
        'ADMIN'
    ),
    (
        3,
        'Usuario Teste Um',
        'usuario@teste.com',
        '$2a$10$fKio.kNawuO0OqiJqT9UEueguc01EHs8CHMJasO5phgql0jw8XuHG',
        'USER'
    ),
    (
        4,
        'Usuario Teste Dois',
        'usuario2@teste.com',
        '$2a$10$fKio.kNawuO0OqiJqT9UEueguc01EHs8CHMJasO5phgql0jw8XuHG',
        'USER'
    );

-- ============================================
-- SALAS DE TESTE
-- ============================================

INSERT INTO salas (id, nome, disponivel, capacidade, localizacao)
VALUES
    (1, 'Sala 01', TRUE,  4, 'Tamboré'),
    (2, 'Sala 02',  TRUE, 4, 'Tamboré'),
    (3, 'Sala 03',   TRUE, 4, 'Tamboré'),
    (4, 'Sala Focus',     TRUE,  2, 'Tamboré'),
    (5, 'Componível 01',  TRUE, 8, 'Tamboré'),
    (6, 'Componível 02',  TRUE, 8, 'Tamboré'),
    (7, 'Componível 03',  TRUE, 8, 'Tamboré'),
    (8, 'Componível 04',  TRUE, 8, 'Tamboré');

-- ============================================
-- AGENDAMENTOS DE TESTE
-- Inclui CONFIRMADO e CANCELADO
-- ============================================

INSERT INTO agendamentos (
    id,
    usuario_id,
    sala_id,
    data_agendamento,
    hora_inicio,
    hora_fim,
    qntd_pessoas,
    titulo,
    usuario_id_solicitante,
    status,
    ultima_atualizacao,
    data_criacao,
    data_cancelamento
)
VALUES
    (
        1, 3, 1, '2026-10-14', '09:00:00', '10:00:00',
        4, 'Reuniao de planejamento', NULL,
        'CONFIRMADO', '2026-10-13 08:00:00',
        '2026-10-10 09:00:00', NULL
    ),
    (
        2, 4, 2, '2026-10-14', '10:00:00', '11:30:00',
        8, 'Revisao de projeto', NULL,
        'CONFIRMADO', '2026-10-13 08:30:00',
        '2026-10-10 10:00:00', NULL
    ),
    (
        3, 3, 3, '2026-10-15', '14:00:00', '16:00:00',
        7, 'Treinamento da equipe', NULL,
        'CONFIRMADO', '2026-10-12 15:00:00',
        '2026-10-11 11:00:00', NULL
    ),
    (
        4, 4, 4, '2026-10-16', '09:00:00', '10:00:00',
        6, 'Reuniao com diretoria', NULL,
        'CANCELADO', '2026-10-13 09:00:00',
        '2026-10-11 14:00:00', '2026-10-13 09:00:00'
    ),
    (
        5, 3, 5, '2026-10-17', '13:00:00', '14:00:00',
        8, 'Sessao colaborativa', NULL,
        'CONFIRMADO', '2026-10-12 16:00:00',
        '2026-10-12 10:00:00', NULL
    ),
    (
        6, 4, 1, '2026-10-18', '15:00:00', '16:00:00',
        5, 'Alinhamento tecnico', NULL,
        'CANCELADO', '2026-10-13 10:00:00',
        '2026-10-12 11:00:00', '2026-10-13 10:00:00'
    ),
    (
        7, 3, 2, '2026-10-19', '08:00:00', '09:00:00',
        7, 'Reuniao de acompanhamento', NULL,
        'CONFIRMADO', '2026-10-12 17:00:00',
        '2026-10-12 12:00:00', NULL
    ),
    (
        8, 4, 3, '2026-10-20', '14:00:00', '15:30:00',
        5, 'Planejamento trimestral', NULL,
        'CONFIRMADO', '2026-10-13 11:00:00',
        '2026-10-13 08:00:00', NULL
    );

-- ============================================
-- LOGS DE TESTE
-- CRIACAO, ALTERACAO e CANCELAMENTO
-- ============================================

INSERT INTO logs (id, agendamento_id, usuario_id, status, data_criacao)
VALUES
    (1, 1, 3, 'CRIACAO',      '2026-10-10 09:00:00'),
    (2, 1, 3, 'ALTERACAO',    '2026-10-11 09:30:00'),
    (3, 2, 4, 'CRIACAO',      '2026-10-10 10:00:00'),
    (4, 2, 2, 'ALTERACAO',    '2026-10-11 11:00:00'),
    (5, 3, 3, 'CRIACAO',      '2026-10-11 11:00:00'),
    (6, 3, 1, 'ALTERACAO',    '2026-10-12 15:00:00'),
    (7, 4, 4, 'CRIACAO',      '2026-10-11 14:00:00'),
    (8, 4, 4, 'CANCELAMENTO', '2026-10-13 09:00:00'),
    (9, 5, 3, 'CRIACAO',      '2026-10-12 10:00:00'),
    (10, 5, 1, 'ALTERACAO',   '2026-10-12 16:00:00'),
    (11, 6, 4, 'CRIACAO',     '2026-10-12 11:00:00'),
    (12, 6, 4, 'CANCELAMENTO','2026-10-13 10:00:00'),
    (13, 7, 3, 'CRIACAO',     '2026-10-12 12:00:00'),
    (14, 8, 4, 'CRIACAO',     '2026-10-13 08:00:00'),
    (15, 8, 2, 'ALTERACAO',   '2026-10-13 11:00:00');

-- ============================================
-- CONVERSAS DE TESTE
-- ============================================

INSERT INTO agendamento_conversas (
    id, usuario_id, status, data_agendamento,
    hora_inicio, hora_fim, qntd_pessoas,
    sala_id, titulo, localizacao
)
VALUES
    (
        1, 3, 'EM_ANDAMENTO', '2026-10-21',
        '09:00:00', '10:00:00', 5,
        1, 'Agendamento para reuniao',
        'Andar 1'
    ),
    (
        2, 4, 'CONCLUIDA', '2026-10-22',
        '14:00:00', '15:00:00', 8,
        2, 'Reserva para equipe',
        'Andar 1'
    );
