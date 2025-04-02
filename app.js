const express = require('express');
const bodyParser = require('body-parser');
const consultarCNPJ = require("consultar-cnpj");
const app = express();

// Configurações
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Rota principal
app.get('/', (req, res) => {
    res.render('index');
});

// Rota para consulta
app.post('/consultar', async (req, res) => {
    const cnpj = req.body.cnpj.replace(/\D/g, ''); // Remove caracteres não numéricos
    
    try {
        const empresa = await consultarCNPJ(cnpj);
        console.log('Dados retornados pela API:', empresa); // Adicione esta linha
        res.render('resultado', { 
            empresa,
            erro: null // Garante que a variável erro exista, mesmo quando não houver erro
        });
    } catch (error) {
        let mensagem = "Erro ao consultar CNPJ";
        if (error.response && error.response.status === 404) {
            mensagem = "CNPJ não encontrado";
        }
        console.error('Erro na consulta:', error); // Adicione esta linha
        res.render('resultado', { 
            empresa: null, // Garante que a variável empresa exista
            erro: `${mensagem}: ${error.message}` 
        });
    }
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;   