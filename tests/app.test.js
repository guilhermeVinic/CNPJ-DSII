const request = require('supertest');
const express = require('express');
const consultarCNPJ = require("consultar-cnpj");

// Criar uma nova instância do app para testes
const createApp = () => {
  const app = express();
  const bodyParser = require('body-parser');
  
  app.set('view engine', 'ejs');
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.static('public'));
  
  app.get('/', (req, res) => {
    res.render('index', { erro: null }); // Adicionado objeto vazio para evitar erros no EJS
  });

  app.post('/consultar', async (req, res) => {
    if (!req.body.cnpj) {
      return res.render('resultado', { 
        empresa: null, 
        erro: 'Por favor, insira um CNPJ válido.' 
      });
    }
    
    const cnpj = req.body.cnpj.replace(/\D/g, '');
    
    try {
      const empresa = await consultarCNPJ(cnpj);
      res.render('resultado', { empresa, erro: null });
    } catch (error) {
      let mensagem = "Não foi possível recuperar os dados do CNPJ.";
      if (error.response && error.response.status === 404) {
        mensagem = "Nenhuma empresa encontrada para esse CNPJ.";
      }
      res.render('resultado', { 
        empresa: null, 
        erro: `${mensagem}: ${error.message}` 
      });
    }
  });

  return app;
};

jest.mock("consultar-cnpj");

describe('API de Consulta de CNPJ', () => {
  let app;
  
  beforeAll(() => {
    app = createApp();
  });

  test('Deve retornar a página inicial', async () => {
    const response = await request(app)
      .get('/')
      .expect(200)
      .expect('Content-Type', /html/);
    
    expect(response.text).toMatch(/Consulta de CNPJ/i);
  });

  test('Deve retornar mensagem de erro para CNPJ não encontrado', async () => {
    const error = new Error('Nenhuma empresa encontrada para esse CNPJ.');
    error.response = { status: 404 };
    
    consultarCNPJ.mockRejectedValue(error);

    const response = await request(app)
      .post('/consultar')
      .type('form')
      .send({ cnpj: '00000000000000' })
      .expect(200);
    
    expect(response.text).toContain('Nenhuma empresa encontrada para esse CNPJ.');
    expect(response.text).not.toContain('Empresa Teste LTDA'); // Verifica que não mostra dados de empresa
  });

  test('Deve tratar erro quando CNPJ não é fornecido', async () => {
    const response = await request(app)
      .post('/consultar')
      .type('form')
      .send({}) // Envia sem CNPJ
      .expect(200);
    
    expect(response.text).toContain('Por favor, insira um CNPJ válido.');
  });
});
