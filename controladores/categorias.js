const pool = require('../conexao');

const listarCategorias = async (req,res)=>{
    const query = await pool.query('select * from categorias');

    const {rows} = query;

    return res.status(200).json(rows)
}

module.exports = {listarCategorias}