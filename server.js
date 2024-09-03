const express = require('express');
const session = require('express-session');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const secretKey = 'minha chave';

// Configurações da aplicação
app.use(cors());
app.use(bodyParser.json());
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: false,
}));

// Emulando banco de dados
const dados = {
  usuarios: [
    { id: '1', nome: 'Jhonas Janz', email: 'jhonas@hotmail.com', senha: '123456', idade: '33', etaria: 'adulto' },
    { id: '2', nome: 'Jessica Janz', email: 'jessica@hotmail.com', senha: '123456', idade: '37', etaria: 'adulto' },
    { id: '3', nome: 'Fellipe Janz', email: 'fellipe@hotmail.com', senha: '123456', idade: '30', etaria: 'adulto' },
    { id: '4', nome: 'Heder Janz', email: 'heder@hotmail.com', senha: '123456', idade: '52', etaria: 'adulto' },
  ],
};

// Função para gerar o token de acesso da sessão
const generateToken = (userID) => {
  return jwt.sign({ userID }, secretKey, { expiresIn: '30m' });
};

// Checagem de token de acesso
const verifyJWT = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) return res.status(401).json({ auth: false, message: 'No token provided.' });

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) return res.status(500).json({ auth: false, message: 'Failed to authenticate token.' });

    req.session.usuarioID = decoded.userID;
    next();
  });
};


const findUserByID = (userID) => {
  return dados.usuarios.find((usuario) => usuario.id === userID) || {};
};



app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  const usuarioLogado = dados.usuarios.find((usuario) => usuario.email === email && usuario.senha === senha);

  if (usuarioLogado) {
    // Classificação da faixa etária com base na idade
    let faixaEtaria;
    const idade = parseInt(usuarioLogado.idade);

    if (idade < 13) {
      faixaEtaria = 'criança';
    } else if (idade >= 13 && idade < 18) {
      faixaEtaria = 'adolescente';
    } else if (idade >= 18 && idade < 60) {
      faixaEtaria = 'adulto';
    } else {
      faixaEtaria = 'idoso';
    }

    // Define sessão e gera token
    req.session.isLogado = true;
    req.session.usuarioID = usuarioLogado.id;

    const token = generateToken(usuarioLogado.id);
    res.json({ sessionID: token, nome: usuarioLogado.nome, faixaEtaria: faixaEtaria });
  } else {
    res.status(401).json({ error: 'Invalid email or password' });
  }
});

app.get('/test', verifyJWT, (req, res) => {
  const usuarioID = req.session.usuarioID;
  const usuario = findUserByID(usuarioID);

  if (usuario) {    
    res.json({ nome: usuario.nome });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.get('/api/categories', verifyJWT, (req, res) => {
  const API_KEY = ''; 

  const categories = [
    {
      name: "trending",
      title: "Em Alta",
      path: `/trending/all/week?api_key=${API_KEY}&language=pt-BR`,
      isLarge: true,
    },
    {
      name: "netflixOriginals",
      title: "Originais Netflix",
      path: `/discover/tv?api_key=${API_KEY}&with_networks=213`,
      isLarge: false,
    },
    {
      name: "topRated",
      title: "Populares",
      path: `/movie/top_rated?api_key=${API_KEY}&language=pt-BR`,
      isLarge: false,
    },
    {
      name: "comedy",
      title: "Comédias",
      path: `/discover/tv?api_key=${API_KEY}&with_genres=35`,
      isLarge: false,
    },
    {
      name: "romances",
      title: "Romances",
      path: `/discover/tv?api_key=${API_KEY}&with_genres=10749`,
      isLarge: false,
    },
    {
      name: "documentaries",
      title: "Documentários",
      path: `/discover/tv?api_key=${API_KEY}&with_genres=99`,
      isLarge: false,
    }
  ];

  res.json({ apiKey: API_KEY, categories });
});

app.listen(8080, () => {
  console.log('Server is running on port 8080');
});
