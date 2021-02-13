'use strict';
const https = require('https');

const callExternalEventApi = async (url, options) => {
  console.log('Start call external API');

  let body = '';
  return new Promise((resolve, reject) => {
    https.get(url, options, res => {
      console.log('statusCode: ', res.statusCode);
      console.log('statusMessage: ', res.statusMessage);
      res.setEncoding('utf8');
      res.on('data', chunk => {
        body += chunk;
      });
      res.on('end', () => {
        resolve(body);
      });
    }).on('error', err => {
      reject(err);
    });
  })
};

module.exports = callExternalEventApi;
