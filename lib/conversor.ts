// Conversões elétricas — kW↔CV↔kVA↔W e mm²↔AWG

export interface RegistroAWG {
  mm2: number
  awg: string
  corrente: number // A — capacidade de condução (cobre, método B1)
}

export const TABELA_AWG_MM2: RegistroAWG[] = [
  { mm2: 1.5,  awg: '16 AWG',    corrente: 13  },
  { mm2: 2.5,  awg: '14 AWG',    corrente: 18  },
  { mm2: 4,    awg: '12 AWG',    corrente: 25  },
  { mm2: 6,    awg: '10 AWG',    corrente: 32  },
  { mm2: 10,   awg: '8 AWG',     corrente: 45  },
  { mm2: 16,   awg: '6 AWG',     corrente: 61  },
  { mm2: 25,   awg: '4 AWG',     corrente: 80  },
  { mm2: 35,   awg: '2 AWG',     corrente: 95  },
  { mm2: 50,   awg: '1 AWG',     corrente: 110 },
  { mm2: 70,   awg: '2/0 AWG',   corrente: 135 },
  { mm2: 95,   awg: '3/0 AWG',   corrente: 160 },
  { mm2: 120,  awg: '4/0 AWG',   corrente: 185 },
  { mm2: 150,  awg: '300 kcmil', corrente: 210 },
]

// ── Potência ──────────────────────────────────────────────────────────────────

export function kWParaCV(kw: number): number   { return kw / 0.7355 }
export function CVParakW(cv: number): number   { return cv * 0.7355 }
export function WParakW(w: number): number     { return w / 1000 }
export function kWParaW(kw: number): number    { return kw * 1000 }
export function kWParakVA(kw: number, fp = 0.92): number { return kw / fp }
export function kVAParakW(kva: number, fp = 0.92): number { return kva * fp }
export function CVParakVA(cv: number, fp = 0.92): number  { return CVParakW(cv) / fp }
export function kVAParaCV(kva: number, fp = 0.92): number { return kVAParakW(kva, fp) / 0.7355 }

// ── Bitola ────────────────────────────────────────────────────────────────────

export function mm2ParaAWG(mm2: number): RegistroAWG | null {
  return TABELA_AWG_MM2.find(r => r.mm2 === mm2) ?? null
}

export function AWGParamm2(awg: string): RegistroAWG | null {
  return TABELA_AWG_MM2.find(r => r.awg === awg) ?? null
}

// ── Tensão ────────────────────────────────────────────────────────────────────

export function VParakV(v: number): number  { return v / 1000 }
export function kVParaV(kv: number): number { return kv * 1000 }

// ── Corrente ──────────────────────────────────────────────────────────────────

export function calcularCorrenteMono(potenciaW: number, tensaoV: number, fp = 1): number {
  return potenciaW / (tensaoV * fp)
}
export function calcularCorrenteTri(potenciaW: number, tensaoV: number, fp = 0.92): number {
  return potenciaW / (Math.sqrt(3) * tensaoV * fp)
}
