const pool = require('../conexao');

const cadastrarTransacao = async(req,res)=>{
    const {tipo, descricao, valor, data, categoria_id} = req.body;
    const usuario = req.usuario.rows[0];

    try {
        if(!descricao|| !valor || !data || !categoria_id || !tipo){
            return res.status(400).json({mensagem: 'Todos os campos obrigatórios devem ser informados!'})
        }

        const verificaCategoria = await pool.query('select * from categorias where id = $1', [categoria_id]);

        if(verificaCategoria.rowCount<1){
            return res.status(400).json({mensagem:'Por favor verifique a categoria que deseja cadastrar!'})
        }

        const queryCadastrarTransacao = await pool.query('insert into transacoes (descricao, valor, data, categoria_id, usuario_id, tipo) values ($1,$2,$3,$4,$5,$6) returning id', [descricao, valor, data, categoria_id, usuario.id, tipo]);

        const transacaoCriada = queryCadastrarTransacao.rows[0];

        const ultimaTransacao = await pool.query('select * from transacoes where id = $1', [transacaoCriada.id]);

        const dadosUltimaTransacao= ultimaTransacao.rows[0];

        const transacaoCadastrada = {
            id: dadosUltimaTransacao.id,
            tipo:dadosUltimaTransacao.tipo,
            descricao:dadosUltimaTransacao.descricao,
            valor:dadosUltimaTransacao.valor,
            data:dadosUltimaTransacao.data,
            usuario_id: usuario.id,
            categoria_id: categoria_id,
            categoria_nome: verificaCategoria.rows[0].descricao
        }
        res.status(201).json(transacaoCadastrada)
        
    } catch (error) {
        return res.status(500).json({mensagem:'Erro interno do servidor'})
    }

}

const listarTransacoes = async(req,res)=>{
    const usuario = req.usuario.rows[0];
    const {filtro} = req.query;
    
    try {
        if(filtro === undefined){
            const query = await pool.query('select * from transacoes where usuario_id = $1',[usuario.id])

            const {rows} = query;
        
            return res.status(200).json(rows)
        }

        if(filtro.length>1){

            const addIn = []
            for(let i= 0; i<filtro.length; i++){
                 const resultado = (`'${filtro[i]}'`)
                addIn.push(resultado)
            }

            const whereClause = `WHERE descricao in (${addIn})`
            const consultaCategorias = (`SELECT * FROM categorias ${whereClause}`);

            const idCategorias = await pool.query(consultaCategorias)
            
            if(idCategorias.rowCount === 0){
                return res.status(404).json({mensagem:'Categoria nao localizada, por favor verifique a categoria digitada'});
            }

            const {rows} = idCategorias;

            const addId = [];
            for(let i= 0; i<rows.length; i++){
                const resultado = (rows[i].id)
                addId.push(resultado)
            }
            
            const filtroVarios = (`select * from transacoes where usuario_id = ${usuario.id} and categoria_id in (${addId})`);

            const queryFiltro = await pool.query(filtroVarios);

            const dadosTransacao = queryFiltro.rows

            return res.status(200).json(dadosTransacao)

              
        }else{
            const filtroString = filtro.toString()
            const localizaCategoria = await pool.query('select * from categorias where descricao = $1',[filtroString]);

            if(localizaCategoria.rowCount === 0){
                return res.status(404).json({mensagem:'Categoria nao localizada, por favor verifique a categoria digitada'});
            }

            const categoriaLocalizada = localizaCategoria.rows

            const query = await pool.query('select * from transacoes where usuario_id = $1 and categoria_id =$2',[usuario.id, categoriaLocalizada[0].id])

            const localizadas = query.rows;

            return res.status(200).json(localizadas);
        }
        
    } catch (error) {
        return res.status(500).json({mensagem:'Erro interno do servidor'});
    }
}

const transacaoPorId = async (req,res)=>{
    const {id} = req.params;
    const usuario = req.usuario.rows[0];

    try {
        const query = await pool.query('select * from transacoes where usuario_id=$1 and id = $2',[usuario.id, id]);

        if(query.rowCount<1){
          return res.status(404).json({mensagem:'A transacao não foi localizada, por favor verifique o id!'})
        }

        const {rows} = query;

        return res.status(200).json(rows);
    } catch (error) {
        return res.status(500).json({mensagem:'Erro interno do servidor!'})
    }

}

const atualizarTransacao = async (req, res) => {
    const { id } = req.params;
    const usuario = req.usuario.rows[0];
    const { tipo, descricao, valor, data, categoria_id } = req.body;

    try {
        if (!descricao || !valor || !data || !categoria_id || !tipo) {
            return res.status(400).json({ mensagem: 'Todos os campos obrigatórios devem ser informados!' });
        }

        const verificaCategoria = await pool.query('select * from categorias where id = $1', [categoria_id]);

        if (verificaCategoria.rows.length < 1) {
            return res.status(400).json({ mensagem: 'Por favor verifique a categoria que deseja cadastrar!' });
        }
        
        const queryAtualizarTransacao = await pool.query(
            'update transacoes set descricao = $1, valor = $2, data = $3, categoria_id = $4, tipo = $5 where id = $6 and usuario_id = $7',
            [descricao, valor, data, categoria_id, tipo, id, usuario.id]
        );

        if (queryAtualizarTransacao.rowCount === 0) {
            return res.status(404).json({ mensagem: 'A transação não foi localizada ou não pertence ao usuário logado.' });
        }

        return res.status(204).json();
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro no servidor' });
    }
}

const deletarTransacao = async (req, res) => {
    const { id } = req.params;
    const usuario = req.usuario.rows[0];

    try {
        const queryTransacao = await pool.query('select * from transacoes where id = $1 and usuario_id = $2', [id, usuario.id]);

        if (queryTransacao.rows.length === 0) {
            return res.status(404).json({ mensagem: 'Transação não encontrada.' });
        }

        const queryExcluirTransacao = await pool.query('delete from transacoes where id = $1', [id]);

        if (queryExcluirTransacao.rowCount === 1) {
            return res.status(204).json();
        } else {
            return res.status(500).json({ mensagem: 'Erro ao excluir a transação.' });
        }
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro no servidor' });
    }
};

const obterExtratoTransacoes = async (req, res) => {
    const usuario = req.usuario.rows[0];

    try {
        const queryEntrada = await pool.query('SELECT SUM(valor) AS total_entrada FROM transacoes WHERE usuario_id = $1 AND tipo = $2', [usuario.id, 'entrada']);
        const totalEntrada = queryEntrada.rows[0].total_entrada || 0;
    
        const querySaida = await pool.query('SELECT SUM(valor) AS total_saida FROM transacoes WHERE usuario_id = $1 AND tipo = $2', [usuario.id, 'saida']);
        const totalSaida = querySaida.rows[0].total_saida || 0;

        return res.status(200).json({ entrada: totalEntrada, saida: totalSaida });
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro no servidor' });
    }
};

module.exports={
    cadastrarTransacao,
    listarTransacoes,
    transacaoPorId,
    atualizarTransacao,
    deletarTransacao,
    obterExtratoTransacoes
}