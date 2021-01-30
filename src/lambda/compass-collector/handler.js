'use strict';
const https = require('https');
const moment = require('moment');

module.exports.compassCollector = async (event, context, callback) => {
  console.log('Start compassCollector handler');
  const currentMonth = moment().format('YYYYMM');
  const url = `https://connpass.com/api/v1/event/?ym=${currentMonth}`;
  const options = {
    headers: {
      'User-Agent': 'Node/12.x'
    }
  };

  await requestCompassData(url, options).then(res => {
    try {
      const data = JSON.parse(res);
      callback(null, {
        statusCode: 200,
        body: JSON.stringify(data.events)
      });
    } catch(e) {
      throw new Error(e);
    };
  }).catch(err => {
    callback(Error(err));
  });
};

const requestCompassData = async (url, options) => {
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
