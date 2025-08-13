DROP TABLE IF EXISTS public.generic_account;

CREATE TABLE public.generic_account (
    id SERIAL PRIMARY KEY,
    game TEXT NOT NULL,
    id_device TEXT NOT NULL,
    username TEXT NOT NULL,
    wins INT DEFAULT 0 NOT NULL,
    losses INT DEFAULT 0 NOT NULL,
    draws INT DEFAULT 0 NOT NULL,
    points INT DEFAULT 0 NOT NULL,
    coins INT DEFAULT 0 NOT NULL,
    gems INT DEFAULT 0 NOT NULL,
    level INT DEFAULT 1 NOT NULL,
    current_exp INT DEFAULT 0 NOT NULL,
    maximum_exp INT DEFAULT 100 NOT NULL, -- nextLevelExp = baseExp * (level ^ factor)
    base_exp INT DEFAULT 100 NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP,
    CONSTRAINT unique_game_and_username UNIQUE (game, username),
    CONSTRAINT unique_game_and_id_device UNIQUE (game, id_device)
);

CREATE INDEX idx_generic_account_game ON public.generic_account (game);
