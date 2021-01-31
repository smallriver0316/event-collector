'use strict';
const callExternalEventApi = require('../request-event');

module.exports.doorkeeperCollector = async (event, context, callback) => {
  console.log('Start doorkeeperCollector handler');
  const url = 'https://api.doorkeeper.jp/events/28319';
  const options = {
    headers: {
      'User-Agent': 'Node/12.x',
      'Authorization': `Bearer ${process.env.DOORKEEPER_API_TOKEN}`
    }
  };

  try {
    const dkRes = await callExternalEventApi(url, options);
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(dkRes)
    });
  } catch(err) {
    callback(new Error(err));
  }
};
