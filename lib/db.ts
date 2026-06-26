import * as SQLite from 'expo-sqlite'

const db = SQLite.openDatabaseSync('EletricaNBR.db')

export function initDB(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projetos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      endereco TEXT,
      responsavel TEXT,
      criado_em INTEGER NOT NULL,
      atualizado_em INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS calculos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projeto_id INTEGER,
      tipo TEXT NOT NULL,
      descricao TEXT,
      entradas TEXT NOT NULL,
      resultado TEXT NOT NULL,
      criado_em INTEGER NOT NULL,
      FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE
    );
  `)
}

// ── Config ───────────────────────────────────────────────────────────────────

export function getConfig(key: string): string | null {
  const row = db.getFirstSync<{ value: string }>('SELECT value FROM config WHERE key = ?', [key])
  return row?.value ?? null
}

export function setConfig(key: string, value: string): void {
  db.runSync('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)', [key, value])
}

// ── Projetos ─────────────────────────────────────────────────────────────────

export interface Projeto {
  id: number
  nome: string
  endereco: string
  responsavel: string
  criado_em: number
  atualizado_em: number
}

export function getProjetos(): Projeto[] {
  return db.getAllSync<Projeto>('SELECT * FROM projetos ORDER BY atualizado_em DESC')
}

export function getProjeto(id: number): Projeto | null {
  return db.getFirstSync<Projeto>('SELECT * FROM projetos WHERE id = ?', [id]) ?? null
}

export function criarProjeto(nome: string, endereco: string, responsavel: string): number {
  const now = Date.now()
  const result = db.runSync(
    'INSERT INTO projetos (nome, endereco, responsavel, criado_em, atualizado_em) VALUES (?, ?, ?, ?, ?)',
    [nome, endereco, responsavel, now, now]
  )
  return result.lastInsertRowId
}

export function atualizarProjeto(id: number, nome: string, endereco: string, responsavel: string): void {
  db.runSync(
    'UPDATE projetos SET nome=?, endereco=?, responsavel=?, atualizado_em=? WHERE id=?',
    [nome, endereco, responsavel, Date.now(), id]
  )
}

export function deletarProjeto(id: number): void {
  db.runSync('DELETE FROM projetos WHERE id = ?', [id])
}

// ── Cálculos ──────────────────────────────────────────────────────────────────

export interface Calculo {
  id: number
  projeto_id: number | null
  tipo: string
  descricao: string
  entradas: string
  resultado: string
  criado_em: number
}

export function getCalculosPorProjeto(projetoId: number): Calculo[] {
  return db.getAllSync<Calculo>(
    'SELECT * FROM calculos WHERE projeto_id = ? ORDER BY criado_em DESC',
    [projetoId]
  )
}

export function salvarCalculo(
  tipo: string,
  descricao: string,
  entradas: object,
  resultado: object,
  projetoId?: number
): number {
  const now = Date.now()
  const r = db.runSync(
    'INSERT INTO calculos (projeto_id, tipo, descricao, entradas, resultado, criado_em) VALUES (?, ?, ?, ?, ?, ?)',
    [projetoId ?? null, tipo, descricao, JSON.stringify(entradas), JSON.stringify(resultado), now]
  )
  return r.lastInsertRowId
}

export function deletarCalculo(id: number): void {
  db.runSync('DELETE FROM calculos WHERE id = ?', [id])
}
