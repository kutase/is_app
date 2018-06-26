BEGIN;

CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    author text NOT NULL,
    name text NOT NULL,
    cover_url text,
    count integer NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS book_orders (
    id SERIAL PRIMARY KEY,
    book_id integer REFERENCES books (id),
    created_at timestamp DEFAULT NOW(),
    expires_at timestamp,
    customer_id integer REFERENCES customers (id),
    is_done boolean DEFAULT FALSE
);

COMMIT;
