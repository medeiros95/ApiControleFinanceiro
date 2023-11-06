const express = require('express');
const usuarios = require('./controladores/usuarios');
const categorias = require('./controladores/categorias');
const { autenticaUsuario } = require('./intermediarios/autenticador');
const  transacoes = require('./controladores/transacoes')

const rotas = express();

rotas.use(express.json())

rotas.post('/usuario', usuarios.cadastrarUsuario)
rotas.post('/login', usuarios.login)

rotas.use(autenticaUsuario)

//rotas usuarios
rotas.get('/usuario', usuarios.detalharUsuario)
rotas.put('/usuario', usuarios.atualizarUsuario)

//rota categorias
rotas.get('/categorias', categorias.listarCategorias)

//rotas transacoes
rotas.post('/transacao', transacoes.cadastrarTransacao)
rotas.get('/transacao', transacoes.listarTransacoes)
rotas.get('/transacao/extrato',transacoes.obterExtratoTransacoes)
rotas.get('/transacao/:id', transacoes.transacaoPorId)
rotas.put('/transacao/:id', transacoes.atualizarTransacao)
rotas.delete('/transacao/:id', transacoes.deletarTransacao)

module.exports=rotas
