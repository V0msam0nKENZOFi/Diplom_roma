-- Создание таблицы пользователей для Neon
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT DEFAULT '',
  password TEXT NOT NULL,
  blocked BOOLEAN DEFAULT false,
  block_reason TEXT DEFAULT '',
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Создание администратора
INSERT INTO users (id, name, email, phone, password, blocked)
VALUES ('admin', 'Администратор', 'admin@technoservice.ru', '', 'Vlvlkoktqw@7!!', false)
ON CONFLICT (email) DO NOTHING;
