-- Seed exchange rates for USD, UZS (Uzbekistani Som), RUB (Russian Ruble)
-- Rates as of early 2025 (approximate)

-- USD to other currencies
INSERT INTO exchange_rates (source_currency, target_currency, rate, fetched_at)
VALUES ('USD', 'UZS', 12850.000000, CURRENT_TIMESTAMP);

INSERT INTO exchange_rates (source_currency, target_currency, rate, fetched_at)
VALUES ('USD', 'RUB', 96.500000, CURRENT_TIMESTAMP);

-- Reverse rates
INSERT INTO exchange_rates (source_currency, target_currency, rate, fetched_at)
VALUES ('UZS', 'USD', 0.000078, CURRENT_TIMESTAMP);

INSERT INTO exchange_rates (source_currency, target_currency, rate, fetched_at)
VALUES ('RUB', 'USD', 0.010363, CURRENT_TIMESTAMP);

-- Cross rates
INSERT INTO exchange_rates (source_currency, target_currency, rate, fetched_at)
VALUES ('RUB', 'UZS', 133.160000, CURRENT_TIMESTAMP);

INSERT INTO exchange_rates (source_currency, target_currency, rate, fetched_at)
VALUES ('UZS', 'RUB', 0.007510, CURRENT_TIMESTAMP);

-- Identity rates
INSERT INTO exchange_rates (source_currency, target_currency, rate, fetched_at)
VALUES ('USD', 'USD', 1.000000, CURRENT_TIMESTAMP);

INSERT INTO exchange_rates (source_currency, target_currency, rate, fetched_at)
VALUES ('UZS', 'UZS', 1.000000, CURRENT_TIMESTAMP);

INSERT INTO exchange_rates (source_currency, target_currency, rate, fetched_at)
VALUES ('RUB', 'RUB', 1.000000, CURRENT_TIMESTAMP);
