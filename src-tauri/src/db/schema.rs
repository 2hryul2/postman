use rusqlite::Connection;

pub fn initialize_database(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS collections (
            id         TEXT PRIMARY KEY,
            name       TEXT NOT NULL,
            parent_id  TEXT,
            sort_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS requests (
            id            TEXT PRIMARY KEY,
            collection_id TEXT REFERENCES collections(id),
            name          TEXT NOT NULL,
            method        TEXT NOT NULL,
            url           TEXT NOT NULL,
            headers       TEXT,
            params        TEXT,
            body_type     TEXT,
            body          TEXT,
            auth_type     TEXT,
            auth_config   TEXT,
            sort_order    INTEGER DEFAULT 0,
            created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS environments (
            id   TEXT PRIMARY KEY,
            name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS env_variables (
            id             TEXT PRIMARY KEY,
            environment_id TEXT REFERENCES environments(id),
            key            TEXT NOT NULL,
            value          TEXT NOT NULL,
            is_secret      INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS history (
            id                  TEXT PRIMARY KEY,
            request_id          TEXT,
            method              TEXT,
            url                 TEXT,
            request_raw         TEXT,
            response_status     INTEGER,
            response_time_ms    INTEGER,
            response_size_bytes INTEGER,
            response_headers    TEXT,
            response_body       TEXT,
            executed_at         DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        ",
    )
}
