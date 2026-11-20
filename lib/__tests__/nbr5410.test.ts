import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  TABELA_CAPACIDADE_COBRE,
  TABELA_CAPACIDADE_ALUMINIO,
  FATORES_TEMPERATURA,
  calcularBitola,
  calcularDisjuntor,
} from '../nbr5410'
import { secaoCaboMotor, LABEL_METODO } from '../motores'
import { TABELA_AWG_MM2 } from '../conversor'

// Valores lidos da ABNT NBR 5410:2004 (corrigida 2008), Tabela 36 — PVC 70 °C, 30 °C ambiente,
// 3 condutores carregados. Fonte local: Downloads\NBR-5410.md, linhas 3913-3953.
const COBRE_SECAO = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120]
const COBRE_B1 = [15.5, 21, 28, 36, 50, 68, 89, 110, 134, 171, 207, 239]
const COBRE_B2 = [15, 20, 27, 34, 46, 62, 80, 99, 118, 149, 179, 206]
const COBRE_C = [17.5, 24, 32, 41, 57, 76, 96, 119, 144, 184, 223, 259]

const AL_SECAO = [16, 25, 35, 50, 70, 95, 120]
const AL_B1 = [53, 70, 86, 104, 133, 161, 186]
const AL_B2 = [48, 62, 77, 92, 116, 139, 160]
const AL_C = [59, 73, 90, 110, 140, 170, 197]

test('Tabela 36 cobre: seções e colunas B1/B2/C idênticas à norma', () => {
  assert.deepEqual(TABELA_CAPACIDADE_COBRE.map(l => l.secao), COBRE_SECAO)
  assert.deepEqual(TABELA_CAPACIDADE_COBRE.map(l => l.b1), COBRE_B1)
  assert.deepEqual(TABELA_CAPACIDADE_COBRE.map(l => l.b2), COBRE_B2)
  assert.deepEqual(TABELA_CAPACIDADE_COBRE.map(l => l.c), COBRE_C)
})

test('Tabela 36 alumínio: seções e colunas B1/B2/C idênticas à norma', () => {
  assert.deepEqual(TABELA_CAPACIDADE_ALUMINIO.map(l => l.secao), AL_SECAO)
  assert.deepEqual(TABELA_CAPACIDADE_ALUMINIO.map(l => l.b1), AL_B1)
  assert.deepEqual(TABELA_CAPACIDADE_ALUMINIO.map(l => l.b2), AL_B2)
  assert.deepEqual(TABELA_CAPACIDADE_ALUMINIO.map(l => l.c), AL_C)
})

test('Tabela 40 (PVC): fatores de temperatura idênticos à norma', () => {
  const norma: Record<number, number> = {
    10: 1.22, 15: 1.17, 20: 1.12, 25: 1.06, 30: 1, 35: 0.94, 40: 0.87, 45: 0.79, 50: 0.71, 55: 0.61,
  }
  for (const { temp, fator } of FATORES_TEMPERATURA) assert.equal(fator, norma[temp], `${temp} °C`)
  assert.equal(FATORES_TEMPERATURA.length, Object.keys(norma).length)
})

test('bitola cobre método B2: 65 A exige 25 mm² (16 mm² B2 admite só 62 A)', () => {
  const r = calcularBitola({ corrente: 65, tensao: 220, comprimento: 1, metodo: 'B2', material: 'cobre' })
  assert.equal(r.bitolaRecomendada, 25)
  assert.equal(r.capacidadeNominal, 80)
})

test('bitola alumínio método C: 74 A exige 35 mm² (25 mm² C admite só 73 A)', () => {
  const r = calcularBitola({ corrente: 74, tensao: 220, comprimento: 1, metodo: 'C', material: 'aluminio' })
  assert.equal(r.bitolaRecomendada, 35)
  assert.equal(r.capacidadeNominal, 90)
})

test('bitola cobre método B1: 20 A → 2,5 mm² (21 A)', () => {
  const r = calcularBitola({ corrente: 20, tensao: 127, comprimento: 1, metodo: 'B1', material: 'cobre' })
  assert.equal(r.bitolaRecomendada, 2.5)
  assert.equal(r.capacidadeNominal, 21)
})

test('bitola aplica fator de temperatura (40 °C PVC = 0,87): 20 A → corrente corrigida 22,99 A', () => {
  const r = calcularBitola({ corrente: 20, tensao: 127, comprimento: 1, metodo: 'B1', material: 'cobre', temperatura: 40 })
  assert.ok(Math.abs(r.correnteCorrigida - 20 / 0.87) < 1e-9)
  assert.equal(r.bitolaRecomendada, 4) // 21 A < 22,99 A
})

test('queda de tensão: 20 A, 30 m só de ida, 127 V, 2,5 mm² cobre = (2·0,0216·30·20/2,5)/127 = 8,16 %', () => {
  const r = calcularBitola({ corrente: 20, tensao: 127, comprimento: 30, metodo: 'B1', material: 'cobre' })
  assert.equal(r.bitolaRecomendada, 2.5)
  assert.ok(Math.abs(r.quedaTensao - 8.16) < 0.01)
  assert.equal(r.quedaAlerta, true)
})

test('queda de tensão usa ρ do cobre a 70 °C (0,0216), não 0,0175', () => {
  const r = calcularBitola({ corrente: 10, tensao: 220, comprimento: 50, metodo: 'C', material: 'cobre' })
  // 10 A em C → 1,5 mm² (17,5 A); ΔU = 2·0,0216·50·10/1,5 = 14,4 V = 6,545 %
  assert.equal(r.bitolaRecomendada, 1.5)
  assert.ok(Math.abs(r.quedaTensao - 6.55) < 0.01)
})

test('bitola: corrente acima da maior seção devolve aviso', () => {
  const r = calcularBitola({ corrente: 400, tensao: 220, comprimento: 1, metodo: 'B1', material: 'cobre' })
  assert.ok(r.aviso)
})

test('disjuntor: In ≥ corrente de projeto (resistiva 127 V, 2540 W = 20 A → 20 A)', () => {
  const r = calcularDisjuntor({ potencia: 2540, tensao: 127, tipoCarga: 'resistiva' })
  assert.equal(r.corrente, 20)
  assert.equal(r.disjuntorIn, 20)
})

test('disjuntor: motor usa margem de 125 %', () => {
  const r = calcularDisjuntor({ potencia: 2000, tensao: 220, tipoCarga: 'motor', fatorPotencia: 1 })
  // 2000/220 = 9,09 A × 1,25 = 11,36 A → próximo padrão = 13 A
  assert.equal(r.disjuntorIn, 13)
})

test('DR obrigatório em áreas molhadas (NBR 5410 5.1.3.2.2) e citação correta', () => {
  for (const amb of ['banheiro', 'cozinha', 'área de serviço', 'garagem', 'área externa']) {
    const r = calcularDisjuntor({ potencia: 1000, tensao: 127, tipoCarga: 'resistiva', ambientes: [amb] })
    assert.equal(r.drObrigatorio, true, amb)
    assert.match(r.motivoDR ?? '', /5\.1\.3\.2\.2/)
    assert.doesNotMatch(r.motivoDR ?? '', /6\.3\.6/)
  }
})

test('DR não obrigatório em sala/quarto', () => {
  const r = calcularDisjuntor({ potencia: 1000, tensao: 127, tipoCarga: 'resistiva', ambientes: ['sala', 'quarto'] })
  assert.equal(r.drObrigatorio, false)
  assert.equal(r.motivoDR, undefined)
})

test('cabo de motor lê a Tabela 36: método B2, In 62 A → 16 mm² (62 A); In 63 A → 25 mm²', () => {
  assert.equal(secaoCaboMotor(62, 'B2'), 16)
  assert.equal(secaoCaboMotor(63, 'B2'), 25)
})

test('cabo de motor: método B1 (15,5 A → 1,5 mm²; 15,6 A → 2,5 mm²) e método C (17,5 A → 1,5 mm²)', () => {
  assert.equal(secaoCaboMotor(15.5, 'B1'), 1.5)
  assert.equal(secaoCaboMotor(15.6, 'B1'), 2.5)
  assert.equal(secaoCaboMotor(17.5, 'C'), 1.5)
  assert.equal(secaoCaboMotor(76, 'C'), 16)
})

test('rótulos dos métodos seguem a Tabela 33 (B2 = cabo multipolar em eletroduto)', () => {
  assert.match(LABEL_METODO.B1, /isolados em eletroduto/)
  assert.match(LABEL_METODO.B2, /multipolar em eletroduto/)
  assert.doesNotMatch(LABEL_METODO.B2, /superf/i)
})

test('conversor mm²↔AWG: coluna de corrente = método B1, cobre, 3 condutores (Tabela 36)', () => {
  const norma: Record<number, number> = {
    1.5: 15.5, 2.5: 21, 4: 28, 6: 36, 10: 50, 16: 68, 25: 89, 35: 110, 50: 134, 70: 171, 95: 207, 120: 239, 150: 275,
  }
  assert.equal(TABELA_AWG_MM2.length, Object.keys(norma).length)
  for (const r of TABELA_AWG_MM2) assert.equal(r.corrente, norma[r.mm2], `${r.mm2} mm²`)
})
