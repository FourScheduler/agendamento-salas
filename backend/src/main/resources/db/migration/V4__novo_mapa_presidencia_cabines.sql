-- ============================================
-- V4 - NOVO MAPA: SALA PRESIDÊNCIA E CABINES
-- Cabines 01 e 02 são duplas (até 4 pessoas);
-- Cabines 03 a 07 são individuais.
-- ============================================

INSERT INTO salas (id, nome, disponivel, capacidade, localizacao, restrito)
VALUES
    (10, 'Sala Presidência', TRUE, 4, 'Tamboré', FALSE),
    (11, 'Cabine 01',        TRUE, 4, 'Tamboré', FALSE),
    (12, 'Cabine 02',        TRUE, 4, 'Tamboré', FALSE),
    (13, 'Cabine 03',        TRUE, 1, 'Tamboré', FALSE),
    (14, 'Cabine 04',        TRUE, 1, 'Tamboré', FALSE),
    (15, 'Cabine 05',        TRUE, 1, 'Tamboré', FALSE),
    (16, 'Cabine 06',        TRUE, 1, 'Tamboré', FALSE),
    (17, 'Cabine 07',        TRUE, 1, 'Tamboré', FALSE);
