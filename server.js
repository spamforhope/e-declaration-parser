const http = require('http');
const request = require("request");
// const options = {
//   hostname: 'public.nazk.gov.ua',
//   path: 'declaration/?q=Івахів',
//   method: 'GET'
// };

// const callback = response => {

//   //another chunk of data has been recieved, so append it to `str`
//   response.on('data', data => {
//     console.log(data.toString());
//   });

//   //the whole response has been recieved, so we just print it out here
//   response.on('end', () => {
//     console.log('ENDED');
//   });
// }

// const req = http.request(options, callback);

// req.on('error', err => console.log(err));

// req.end();


request({url: 'https://public-api.nazk.gov.ua/v1/declaration/', qs: {q: 'Івахів Степан Петрович'}}, (error, response, body) => {
  console.log(error)
  console.log(JSON.parse(body));
});