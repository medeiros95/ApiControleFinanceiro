const pool = require('../conexao');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const {senhaJwt} = require('../senhaJwt');

const cadastrarUsuario = async(req, res)=>{
    const {nome, email, senha} = req.body;

    try {
        const verificaEmailCadastrado = await pool.query('select * from usuarios where email = $1', [email])

        if(verificaEmailCadastrado.rowCount > 0){
            return res.status(400).json({mensagem: 'Já existe usuário cadastrado com o e-mail informado.'})
        }

        if(!nome|| !email || !senha){
            return res.status(400).json({mensagem: 'Você deve informar os campos obrigatórios: Nome, Email e Senha!'})
        }

        const senhaCriptografada = await bcrypt.hash(senha,10);

        const query = 'insert into usuarios (nome, email, senha) values ($1,$2,$3) returning id, nome, email';

        const params = [nome, email,senhaCriptografada]

        const cadastroUsuario = await pool.query(query, params);

        return res.status(201).json(cadastroUsuario.rows[0]);

    } catch (error) {
        return res.status(500).json({mensagem: 'Erro interno do servidor'})
    }
}

const login = async(req,res)=>{
    const {email, senha} = req.body;
    
    try{
        const usuario = await pool.query('select * from usuarios where email = $1', [email])

        if(usuario.rowCount < 1){
            return res.status(400).json({mensagem: 'Email ou senha invalidos.'})
        }

        if(!email || !senha){
            return res.status(400).json({mensagem: 'Você deve informar email e senha para login.'})
        }

        const confirmaSenha = await bcrypt.compare(senha,usuario.rows[0].senha);

        if(!confirmaSenha){
            return res.status(400).json({mensagem: 'Email ou senha invalidos.'})
        }

        const token = jwt.sign({id: usuario.rows[0].id}, senhaJwt, {expiresIn: '8h'});

        const {senha: _, ...usuarioLogado} = usuario.rows[0]

        return res.status(200).json({usuario: usuarioLogado, token});
    }
    catch (error) {
        return res.status(500).json({mensagem: 'Erro interno do servidor'})
    }
}

const detalharUsuario = async(req,res)=>{
    try {
        const {senha: _, ...usuarioLogado} = req.usuario.rows[0];
        
        return res.status(200).json(usuarioLogado)

    } catch (error) {
        return res.status(500).json({mensagem:'Erro interno do servidor'})
    }

}
const atualizarUsuario = async(req,res)=>{
    const {nome, email, senha} = req.body
    const usuario = req.usuario.rows[0]

    try {

        if(!nome|| !email || !senha){
            return res.status(400).json({mensagem: 'Você deve informar os campos obrigatórios: Nome, Email e Senha!'})
        }

        const queryVerificaEmail = await pool.query('select id from usuarios where email = $1', [email]);

        const {rows} = queryVerificaEmail;

        if(queryVerificaEmail.rowCount < 1 || usuario.email === email){
            const senhaCriptografada = await bcrypt.hash(senha,10);

            const queryAtualizaUsuario = await pool.query('update usuarios set nome = $1, email = $2, senha = $3 where id = $4', [nome, email,senhaCriptografada, usuario.id])
            
            return res.status(200).json();
        }

        if(rows.id != usuario.id){
            return res.status(400).json({mensagem:'O e-mail informado já está sendo utilizado por outro usuário.'})
        }

    } catch (error) {
        return res.status(500).json({mensagem:'Erro interno do servidor'})
    }

}


module.exports = {
    cadastrarUsuario,
    login,
    detalharUsuario,
    atualizarUsuario
}