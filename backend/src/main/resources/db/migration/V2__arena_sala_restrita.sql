-- ============================================
-- V2 - ARENA: SALA RESTRITA PARA EVENTOS
-- A Arena não tem capacidade definida (reserva de eventos) e
-- só pode ser reservada pelo perfil ADMIN (regra no backend).
-- ============================================

ALTER TABLE salas ADD COLUMN restrito BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE salas MODIFY capacidade INT NULL;

INSERT INTO salas (id, nome, disponivel, capacidade, localizacao, restrito)
VALUES (9, 'Arena', TRUE, NULL, 'Tamboré', TRUE);
