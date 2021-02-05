'use strict';
const moment = require('moment');
var AWS = require('aws-sdk');
var kinesisClient = new AWS.Kinesis({apiVersion: '2013-12-02'});

var KinesisStream = require('../../aws/kinesis-stream');
const callExternalEventApi = require('../request-event');

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
    const compassRes = await callExternalEventApi(url, options);
    const compassData = JSON.parse(compassRes);

    const kinesisStream = new KinesisStream(kinesisClient);
    const kinesisRes = await kinesisStream.putRecords(compassData.events);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify(kinesisRes)
    });
  } catch(err) {
    callback(new Error(err))
  }
};
