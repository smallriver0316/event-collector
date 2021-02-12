'use strict';
const moment = require('moment');
var AWS = require('aws-sdk');
var kinesisClient = new AWS.Kinesis({ apiVersion: '2013-12-02' });

var KinesisStream = require('../../aws/kinesis-stream');
const callExternalEventApi = require('../request-event');

module.exports.doorkeeperCollector = async (event, context, callback) => {
  console.log('Start doorkeeperCollector handler');

  const startOfMonth = moment().startOf('month').format('YYYYMMDD');
  const endOfMonth = moment().endOf('month').format('YYYYMMDD');
  const url = `https://api.doorkeeper.jp/events/?page=1&since=${startOfMonth}&until=${endOfMonth}`;
  const options = {
    headers: {
      'User-Agent': 'Node/12.x',
      'Authorization': `Bearer ${process.env.DOORKEEPER_API_TOKEN}`
    }
  };

  try {
    const doorkeeperRes = await callExternalEventApi(url, options);
    const doorkeeperData = JSON.parse(doorkeeperRes);
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
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(res)
    });
  } catch(err) {
    callback(new Error(err));
  }
};
