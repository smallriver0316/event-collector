'use strict';
var AWS = require('aws-sdk');
var smClient = new AWS.SecretsManager({apiVersion: '2017-10-17'});
var rdsClient = new AWS.RDSDataService({apiVersion: '2018-08-01'});
var sts = new AWS.STS();

const SecretsManager = require('../../aws/secrets-manager');
const RdsDataService = require('../../aws/rds-aurora');

module.exports.eventPusher = async (event, context, callback) => {
  console.log(JSON.stringify(event));
  try {
    const secretsMasnager = new SecretsManager(smClient);
    const secret = await secretsMasnager.getSecretValue(process.env.SECRETS_MANAGER_NAME);
    console.log(secret);

    const dbInfo = JSON.parse(secret.SecretString);
    const region = process.env.AWS_REGION;
    const accountId = (await sts.getCallerIdentity({}).promise()).Account;
    const resourceArn = `arn:aws:rds:${region}:${accountId}:cluster:${dbInfo.dbClusterIdentifier}`;

    const rdsDataService = new RdsDataService(rdsClient);
    const res = await rdsDataService.executeSelectAll(resourceArn, secret.ARN);
    console.log(res);

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
