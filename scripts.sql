DROP TABLE IF EXISTS public.generic_account;

CREATE TABLE public.generic_account (
    id SERIAL PRIMARY KEY,
    application TEXT NOT NULL,
    id_device TEXT NOT NULL,
    username TEXT NOT NULL,
    points INT DEFAULT 0 NOT NULL,
    coins INT DEFAULT 0 NOT NULL,
    gems INT DEFAULT 0 NOT NULL,
    level INT DEFAULT 1 NOT NULL,
    current_exp INT DEFAULT 0 NOT NULL,
    next_level_exp INT DEFAULT 100 NOT NULL,
    base_exp INT DEFAULT 100 NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP,
    CONSTRAINT unique_application_and_username UNIQUE (application, username),
    CONSTRAINT unique_application_and_id_device UNIQUE (application, id_device)
);

CREATE INDEX idx_generic_account_application ON public.generic_account (application);
