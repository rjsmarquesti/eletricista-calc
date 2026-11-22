import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseBitola, capacidadeBitola, bitolaMinima, validarRamo,
  serializarUnifilar, desserializarUnifilar, BITOLAS_DISPONIVEIS,
  DadosUnifilar, RamoUnifilar,
} from '../unifilar'

const RAMO_OK: RamoUnifilar = { nome: 'Chuveiro', amperagem: 32, bitola: '6mm²', isDR: true, icone: 'aquecimento' }

const DADOS: DadosUnifilar = {
  nomeProjeto: 'Casa do João',
  tensao: '220V',
  iGeneral: 63,
  bitolaPrincipal: '16mm²',
  ramos: [RAMO_OK, { nome: 'Iluminação', amperagem: 10, bitola: '1,5mm²', isDR: false, icone: 'luz' }],
}

test('parseBitola lê vírgula, ponto e sufixo; recusa lixo', () => {
  assert.equal(parseBitola('2,5mm²'), 2.5)
  assert.equal(parseBitola('2.5'), 2.5)
  assert.equal(parseBitola('6mm²'), 6)
  assert.equal(parseBitola('abc'), null)
  assert.equal(parseBitola(''), null)
})

test('capacidadeBitola = Tabela 36, método B1, cobre', () => {
  assert.equal(capacidadeBitola('1,5mm²'), 15.5)
  assert.equal(capacidadeBitola('2,5mm²'), 21)
  assert.equal(capacidadeBitola('6mm²'), 36)
  assert.equal(capacidadeBitola('16mm²'), 68)
  assert.equal(capacidadeBitola('3mm²'), null)
})

test('bitolaMinima: menor seção cuja capacidade cobre o disjuntor', () => {
  assert.equal(bitolaMinima(10), '1,5mm²')
  assert.equal(bitolaMinima(16), '2,5mm²')   // 1,5 mm² suporta só 15,5 A
  assert.equal(bitolaMinima(20), '2,5mm²')
  assert.equal(bitolaMinima(32), '6mm²')     // 4 mm² suporta só 28 A
  assert.equal(bitolaMinima(40), '10mm²')    // 6 mm² suporta só 36 A
  assert.equal(bitolaMinima(63), '16mm²')
  assert.equal(bitolaMinima(1000), null)     // além da tabela
})

test('BITOLAS_DISPONIVEIS cobre todas as seções da tabela, em ordem', () => {
  assert.deepEqual(BITOLAS_DISPONIVEIS.slice(0, 4), ['1,5mm²', '2,5mm²', '4mm²', '6mm²'])
  assert.equal(BITOLAS_DISPONIVEIS.length, 12)
})

test('validarRamo: ramo correto não gera aviso', () => {
  assert.deepEqual(validarRamo(RAMO_OK), [])
})

test('validarRamo: disjuntor maior que a capacidade do cabo é aviso (40 A em 6 mm²)', () => {
  const av = validarRamo({ ...RAMO_OK, amperagem: 40 })
  assert.equal(av.length, 1)
  assert.match(av[0], /excede/)
  assert.match(av[0], /36/)
  assert.match(av[0], /10mm²/)  // sugere a seção mínima
})

test('validarRamo: seção fora da tabela, nome vazio e corrente inválida', () => {
  assert.match(validarRamo({ ...RAMO_OK, bitola: '3mm²' })[0], /fora da tabela/i)
  assert.match(validarRamo({ ...RAMO_OK, nome: '  ' })[0], /nome/i)
  assert.match(validarRamo({ ...RAMO_OK, amperagem: 0 })[0], /corrente/i)
  assert.match(validarRamo({ ...RAMO_OK, amperagem: NaN })[0], /corrente/i)
})

test('serializar/desserializar: ida e volta preserva tudo', () => {
  assert.deepEqual(desserializarUnifilar(serializarUnifilar(DADOS)), DADOS)
})

test('desserializar: JSON inválido ou estrutura errada devolve null (nunca lança)', () => {
  assert.equal(desserializarUnifilar('{nao é json'), null)
  assert.equal(desserializarUnifilar('null'), null)
  assert.equal(desserializarUnifilar('{}'), null)
  assert.equal(desserializarUnifilar(JSON.stringify({ ...DADOS, ramos: 'x' })), null)
  assert.equal(desserializarUnifilar(JSON.stringify({ ...DADOS, tensao: '999V' })), null)
  assert.equal(desserializarUnifilar(JSON.stringify({ ...DADOS, ramos: [{ nome: 1 }] })), null)
})

test('desserializar: ícone desconhecido vira "tomada" em vez de quebrar o SVG', () => {
  const sujo = { ...DADOS, ramos: [{ ...RAMO_OK, icone: 'foguete' }] }
  const d = desserializarUnifilar(JSON.stringify(sujo))
  assert.ok(d)
  assert.equal(d.ramos[0].icone, 'tomada')
})
