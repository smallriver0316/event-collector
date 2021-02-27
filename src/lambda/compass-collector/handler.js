'use strict';
const moment = require('moment');
var AWS = require('aws-sdk');
var kinesisClient = new AWS.Kinesis({ apiVersion: '2013-12-02' });

var KinesisStream = require('../../aws/kinesis-stream');
const callExternalEventApi = require('../request-event');

const MAX_EVENTS_NUM = 2000;

module.exports.compassCollector = async (event, context, callback) => {
  console.log('Start compassCollector handler');

  let params = {}; // { year, month }
  if (event.body) {
    // in the case of requested via API Gateway
    params = JSON.parse(event.body);
  } else {
    params = event;
  }

  if (!params.year || !params.month) {
    console.error(JSON.stringify(event));
    callback(new Error('Target year and month undefined!'));
  }

  const year = String(params.year);
  const month = ('0' + params.month).slice(-2);
  const yyyymm = year + month;
  console.log(`Target year and month is ${yyyymm}`);

  const currentMonth = moment(yyyymm, 'YYYYMM').format('YYYYMM');

  try {
    const res = await requestCompassData(currentMonth, 1);
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(res)
    });
  } catch(err) {
    callback(new Error(err))
  }
};

async function requestCompassData(currentMonth, startIndex) {
  console.log(`Start request to Compass for month: ${currentMonth}, startIndex: ${startIndex}`);

  const url = `https://connpass.com/api/v1/event/?ym=${currentMonth}&start=${startIndex}`;
  const options = {
    headers: {
      'User-Agent': 'Node/12.x'
    }
  };

  const compassRes = await callExternalEventApi(url, options);
  const compassData = JSON.parse(compassRes);
  const allEvents = compassData.results_available > MAX_EVENTS_NUM ? MAX_EVENTS_NUM : compassData.results_available;
  const requestedEvents = compassData.results_returned;
  const remainedEvents = allEvents - (startIndex + requestedEvents - 1);

  console.log(`All events: ${allEvents}, Fetched events: ${requestedEvents}, Remained events: ${remainedEvents}`);

  const events = compassData.events.map(event => {
    return {
      id: 'compass' + event.event_id,
      origin: 'compass',
      event_id: event.event_id,
      title: event.title,
      description: event.description,
      event_url: event.event_url,
      start_time: event.started_at,
      end_time: event.ended_at,
      ticket_limit: event.limit,
      accepted: event.accepted,
      waiting: event.waiting,
      updated_at: event.updated_at,
      place: event.place,
      address: event.address,
      lat: event.lat,
      lon: event.lon
    };
  });

  const kinesisStream = new KinesisStream(kinesisClient);
  const res = await kinesisStream.putRecords(events);
  if (remainedEvents > 0) {
    return requestCompassData(currentMonth, startIndex + requestedEvents);
  } else {
    return res;
  }
}
