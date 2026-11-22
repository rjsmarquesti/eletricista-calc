import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcularCircuitos, TABELA_CAPACIDADE_COBRE, ResultadoCircuitos, AmbienteResidencial } from '../nbr5410'
import { gerarUnifilar } from '../unifilar'

const AMBIENTES: AmbienteResidencial[] = [
  { tipo: 'sala', area: 20 },
  { tipo: 'banheiro', area: 5, cargas: ['chuveiro'] },
  { tipo: 'dormitorio', area: 12, cargas: ['ar_cond'] },
  { tipo: 'cozinha', area: 10, cargas: ['forno', 'freezer', 'microondas'] },
  { tipo: 'area_servico', area: 6, cargas: ['lavadora'] },
]

const CFG = { nomeProjeto: 'Teste', tensao: '220V' as const, iGeneral: 0 }

function ramo(nome: RegExp) {
  const dados = gerarUnifilar(calcularCircuitos(AMBIENTES), CFG)
  const r = dados.ramos.find(x => nome.test(x.nome))
  assert.ok(r, `ramo ${nome} não encontrado`)
  return r
}

test('iluminação: disjuntor 10 A e 1,5 mm²', () => {
  const r = ramo(/Iluminação geral/)
  assert.equal(r.amperagem, 10)
  assert.equal(r.bitola, '1,5mm²')
})

test('TUG: disjuntor 16 A e 2,5 mm² (não os "10A" do texto da descrição)', () => {
  const r = ramo(/Tomadas gerais/)
  assert.equal(r.amperagem, 16)
  assert.equal(r.bitola, '2,5mm²')
})

test('chuveiro: disjuntor 32 A (não os 40A do cabo), 6 mm², DR', () => {
  const r = ramo(/Chuveiro/)
  assert.equal(r.amperagem, 32)
  assert.equal(r.bitola, '6mm²')
  assert.equal(r.isDR, true)
})

test('ar-condicionado: não pode sair 30 A em 2,5 mm² (cabo suporta 21 A) — 20 A em 2,5 mm²', () => {
  const r = ramo(/Ar-condicionado/)
  assert.equal(r.amperagem, 20)
  assert.equal(r.bitola, '2,5mm²')
})

test('forno, freezer e micro-ondas: TUE 20 A em 2,5 mm²', () => {
  for (const n of [/Forno/, /Freezer/, /Micro-ondas/]) {
    const r = ramo(n)
    assert.equal(r.amperagem, 20, String(n))
    assert.equal(r.bitola, '2,5mm²', String(n))
  }
})

test('DR preservado: máquina de lavar e área de serviço com DR; forno e freezer sem', () => {
  assert.equal(ramo(/Máquina de lavar/).isDR, true)
  assert.equal(ramo(/Área de Serviço/).isDR, true)
  assert.equal(ramo(/Forno/).isDR, false)
  assert.equal(ramo(/Freezer/).isDR, false)
})

test('todo ramo gerado tem disjuntor ≤ capacidade do cabo (Tabela 36, método B1, cobre)', () => {
  const dados = gerarUnifilar(calcularCircuitos(AMBIENTES), CFG)
  for (const r of dados.ramos) {
    const secao = parseFloat(r.bitola.replace(',', '.'))
    const linha = TABELA_CAPACIDADE_COBRE.find(l => l.secao === secao)
    assert.ok(linha, `${r.nome}: seção ${r.bitola} fora da tabela`)
    assert.ok(r.amperagem <= linha.b1, `${r.nome}: ${r.amperagem} A em ${r.bitola} (cabo suporta ${linha.b1} A)`)
  }
})

test('resultado salvo antes desta versão (sem campos estruturados) continua funcionando pela descrição', () => {
  const antigo: ResultadoCircuitos = {
    circuitos: [
      { nome: 'Forno antigo', tipo: 'dedicado', descricao: 'Circuito exclusivo TUE 20A. Disjuntor 20A, fio 2,5mm².' },
    ],
    totalCircuitos: 1,
    observacoes: [],
  }
  const dados = gerarUnifilar(antigo, CFG)
  assert.equal(dados.ramos[0].amperagem, 20)
  assert.equal(dados.ramos[0].bitola, '2,5mm²')
})

test('corrente geral calculada = soma dos disjuntores × 0,65, arredondada para cima', () => {
  const dados = gerarUnifilar(calcularCircuitos(AMBIENTES), CFG)
  const soma = dados.ramos.reduce((a, r) => a + r.amperagem, 0)
  assert.equal(dados.iGeneral, Math.ceil(soma * 0.65))
})

test('corrente geral informada (> 0) é respeitada', () => {
  const dados = gerarUnifilar(calcularCircuitos(AMBIENTES), { ...CFG, iGeneral: 63 })
  assert.equal(dados.iGeneral, 63)
})
