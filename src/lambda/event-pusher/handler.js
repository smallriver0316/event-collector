'use strict';
var AWS = require('aws-sdk');
var smClient = new AWS.SecretsManager({apiVersion: '2017-10-17'});

const SecretsManager = require('../../aws/secrets-manager');

module.exports.eventPusher = async (event, context, callback) => {
  console.log(JSON.stringify(event));
  try {
    const secretsMasnager = new SecretsManager(smClient);
    const secret = await secretsMasnager.getSecretValue(process.env.SECRETS_MANAGER_NAME);
    console.log(secret);

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
