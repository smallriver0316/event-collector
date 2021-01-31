'use strict';

module.exports.eventPusher = async (event, context, callback) => {
  console.log(JSON.stringify(event));
  try {
    event.Records.forEach(function(record) {
      // Kinesis data is base64 encoded so decode here
      var payload = Buffer.from(record.kinesis.data, 'base64').toString('utf-8');
      console.log('Decoded payload:', payload);
    });
    callback(null, {
      statusCode: 200
    });
  } catch(e) {
    callback(new Error(e));
  }
}
