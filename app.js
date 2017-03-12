const express = require('express'),
      path = require('path'),
      fs = require('fs'),
      logger = require('morgan'),
      cookieParser = require('cookie-parser'),
      bodyParser = require('body-parser'),
      methodOverride = require('method-override'),
      axios = require('axios'),
      app = express(),
      API_URL = 'https://public-api.nazk.gov.ua/v1/declaration/';

app.use(cookieParser());
app.use(express.static(path.join(__dirname + '/static')));
app.use(logger("dev"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(methodOverride("_method"));

const errorHandler = error => console.log('API_ERROR', error);

let dataArr = [];

function callNazkApi (items) {
  console.log(items);
  return Promise.all(items.map(item => axios.get(`${API_URL}${item.id}`).then(response => response.data)));
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.get('/parse', (req, res) => {
  dataArr = [];
  const fileData = JSON.parse(fs.readFileSync('PERSON.json', 'utf8'));

  callNazkApi(fileData.items).then(result => {
    res.send({data: result});
  }).catch(err => res.send(err));
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

module.exports = app;
