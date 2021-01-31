'use strict';
const https = require('https');
const moment = require('moment');
var AWS = require('aws-sdk');
var kinesis = new AWS.Kinesis({apiVersion: '2013-12-02'});

var KinesisStream = require('../../aws/kinesis-stream');

module.exports.compassCollector = async (event, context, callback) => {
  console.log('Start compassCollector handler');
  const currentMonth = moment().format('YYYYMM');
  const url = `https://connpass.com/api/v1/event/?ym=${currentMonth}`;
  const options = {
    headers: {
      'User-Agent': 'Node/12.x'
    }
  };

  try {
    const compassRes = await requestCompassData(url, options);
    const compassData = JSON.parse(compassRes);

    const kinesisStream = new KinesisStream(kinesis);
    const kinesisRes = await kinesisStream.putRecords(compassData.events);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify(kinesisRes)
    });
  } catch(err) {
    callback(new Error(err))
  }
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
