const http = require('http');
const { spawn } = require('child_process');

console.log('Starting server for verification...');
const server = spawn('node', ['./bin/www']);

server.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

server.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

setTimeout(() => {
  console.log('Sending request to http://localhost:8000/ ...');
  http.get('http://localhost:8000/', (res) => {
    console.log('Status:', res.statusCode);
    if (res.statusCode === 200) {
      console.log('Verification successful');
      server.kill();
      process.exit(0);
    } else {
      console.error('Verification failed with status:', res.statusCode);
      server.kill();
      process.exit(1);
    }
  }).on('error', (e) => {
    console.error('Request error:', e.message);
    server.kill();
    process.exit(1);
  });
}, 5000);
