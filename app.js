const express = require('express'),
      path = require('path'),
      logger = require('morgan'),
      cookieParser = require('cookie-parser'),
      bodyParser = require('body-parser'),
      methodOverride = require('method-override'),
      axios = require('axios'),
      app = express(),
      NAZK_API_URL = 'https://public-api.nazk.gov.ua/v1/declaration',
      NBU_API_URL = 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange';

app.use(cookieParser());
app.use(express.static(path.join(__dirname + '/static')));
app.use(logger('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(methodOverride('_method'));

const errorHandler = error => console.log('API_ERROR', error);

function callNazkApi (items) {
  return Promise.all(items.map(item => axios.get(`${NAZK_API_URL}/${item.id}`).then(response => response.data).catch(err => {console.log(err); return err;})));
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.get('/search/:name', (req, res) => {
  axios.get(NAZK_API_URL, {params: {q: req.params.name}}).then(response => {
    if (response.data.items) {
      callNazkApi(response.data.items).then(result => {
        const declarations = [];
        const specifications = [];

        result.map(doc => {
          const checkingKey = doc.data.step_0;

          if (checkingKey.changesYear) {
            specifications.push(doc)
          } else if (checkingKey.declarationType) {
            declarations.push(doc);
          }
        });

        declarations.sort((a,b) => {
          // formatting dates to 'year.month.day'
          const firstDate = a.created_date.split('.').reverse().join('.');
          const secondDate = b.created_date.split('.').reverse().join('.');

          return new Date(secondDate).getTime() - new Date(firstDate).getTime();
        });

        res.send({declaration: declarations[0].data, specifications});
      }).catch(err => res.send(err));
    } else {
      res.status(404).send();
    }
  }).catch(err => {
    errorHandler(err);
    res.status(404).send();
  });
});

app.get('/exchange-rates', (req, res) => {
  axios.get(NBU_API_URL, {params: {json: true}})
    .then(response => res.send(response.data))
    .catch(err => {
      errorHandler(err);
      res.status(err.status).send(err.data);
    });
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

module.exports = app;
