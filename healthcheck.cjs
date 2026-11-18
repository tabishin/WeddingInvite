/**
 * Container health check script for Docker and Portainer
 * Reliably validates that the Node HTTP server is actively responding on /health
 */
const http = require('http');

const port = process.env.PORT || 3000;
const options = {
  host: '127.0.0.1',
  port: port,
  path: '/health',
  timeout: 3500,
};

const req = http.request(options, (res) => {
  res.resume(); // drain stream to allow socket cleanup
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    console.error(`Healthcheck failed: received HTTP ${res.statusCode}`);
    process.exit(1);
  }
});

req.on('timeout', () => {
  req.destroy();
  console.error(`Healthcheck timed out after 3.5s connecting to 127.0.0.1:${port}/health`);
  process.exit(1);
});

req.on('error', (err) => {
  console.error(`Healthcheck connection error on 127.0.0.1:${port}: ${err.message}`);
  process.exit(1);
});

req.end();
