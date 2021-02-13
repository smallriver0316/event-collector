'use strict';
const moment = require('moment');
var AWS = require('aws-sdk');
var kinesisClient = new AWS.Kinesis({ apiVersion: '2013-12-02' });

var KinesisStream = require('../../aws/kinesis-stream');
const callExternalEventApi = require('../request-event');

const MAX_EVENTS_NUM = 2000;
const EVENTS_NUM_PER_PAGE = 25;

module.exports.doorkeeperCollector = async (event, context, callback) => {
  console.log('Start doorkeeperCollector handler');

  const startOfMonth = moment().startOf('month').format('YYYYMMDD');
  const endOfMonth = moment().endOf('month').format('YYYYMMDD');

  try {
    const res = await requestDoorkeeperData(startOfMonth, endOfMonth, 1);
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(res)
    });
  } catch(err) {
    callback(new Error(err));
  }
};

async function requestDoorkeeperData(startDate, endDate, page) {
  console.log(`Start request to Doorkeeper since ${startDate}, until ${endDate}, page ${page}`);

  const url = `https://api.doorkeeper.jp/events/?since=${startDate}&until=${endDate}&page=${page}`;
  const options = {
    headers: {
      'User-Agent': 'Node/12.x',
      'Authorization': `Bearer ${process.env.DOORKEEPER_API_TOKEN}`
    }
  };

  const doorkeeperRes = await callExternalEventApi(url, options);
  const doorkeeperData = JSON.parse(doorkeeperRes);
  const requestedEvents = Array.isArray(doorkeeperData) ? doorkeeperData.length : 0;
  const remainedEvents = MAX_EVENTS_NUM - (page - 1) * EVENTS_NUM_PER_PAGE - requestedEvents;

  console.log(`Fetched events: ${requestedEvents}, Remained events: ${remainedEvents}`);
  if (requestedEvents === 0) {
    return {
      result: doorkeeperRes,
      message: `There is no remained events since ${startDate} until ${endDate}`
    };
  }

  const events = doorkeeperData.map(data => {
    return {
      id: 'doorkeeper' + data.event.id,
      origin: 'doorkeeper',
      event_id: data.event.id,
      title: data.event.title,
      description: data.event.description,
      event_url: data.event.public_url,
      start_time: data.event.starts_at,
      end_time: data.event.ends_at,
      ticket_limit: data.event.ticket_limit,
      accepted: data.event.participants,
      waiting: data.event.waitlisted,
      updated_at: data.event.updated_at,
      place: data.event.venue_name,
      address: data.event.address,
      lat: data.event.lat,
      lon: data.event.long
    };
  });

  const kinesisStream = new KinesisStream(kinesisClient);
  const res = await kinesisStream.putRecords(events);
  if (remainedEvents > 0) {
    return requestDoorkeeperData(startDate, endDate, page + 1);
  } else {
    return res;
  }
}
