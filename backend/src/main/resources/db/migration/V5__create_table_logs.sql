-- AGENDAMENTOS
ALTER TABLE agendamentos
    ADD COLUMN data_criacao DATETIME NULL;

UPDATE agendamentos
SET data_criacao = CURRENT_TIMESTAMP
WHERE data_criacao IS NULL;

ALTER TABLE agendamentos
    MODIFY COLUMN data_criacao DATETIME NOT NULL;

ALTER TABLE agendamentos
    MODIFY COLUMN data_agendamento DATE NOT NULL;