'use strict';
var AWS = require('aws-sdk');
var smClient = new AWS.SecretsManager({apiVersion: '2017-10-17'});
var rdsClient = new AWS.RDSDataService({apiVersion: '2018-08-01'});
var sts = new AWS.STS();

const SecretsManager = require('../../aws/secrets-manager');
const RdsDataService = require('../../aws/rds-aurora');

const INSERT_STRING = `insert into ${process.env.TABLE_NAME} VALUES (:id, :origin, :event_id, :title, :description, :event_url, :start_time, :end_time, :ticket_limit, :accepted, :waiting, :updated_at, :place, :address, :lat, :lon)`;
const CONFLICT_STRING = ' on conflict (id) do update set title = EXCLUDED.title, description = EXCLUDED.description, start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, ticket_limit = EXCLUDED.ticket_limit, accepted = EXCLUDED.accepted, waiting = EXCLUDED.waiting, updated_at = EXCLUDED.updated_at, place = EXCLUDED.place, address = EXCLUDED.address, lat = EXCLUDED.lat, lon = EXCLUDED.lon';

module.exports.eventPusher = async (event, context, callback) => {
  console.log(JSON.stringify(event));
  try {
    const secretsMasnager = new SecretsManager(smClient);
    const secret = await secretsMasnager.getSecretValue(process.env.SECRETS_MANAGER_NAME);

    const dbInfo = JSON.parse(secret.SecretString);
    const region = process.env.AWS_REGION;
    const accountId = (await sts.getCallerIdentity({}).promise()).Account;
    const resourceArn = `arn:aws:rds:${region}:${accountId}:cluster:${dbInfo.dbClusterIdentifier}`;

    const parameterSets = event.Records.map(record => {
      // Kinesis data is base64 encoded so decode here
      const eventStr = Buffer.from(record.kinesis.data, 'base64').toString('utf-8');
      console.log(eventStr);
      const event = JSON.parse(eventStr);
      return [
        {
          name: 'id',
          value: { stringValue: event.id }
        },
        {
          name: 'origin',
          value: { stringValue: event.origin }
        },
        {
          name: 'event_id',
          value: { stringValue: '' + event.event_id }
        },
        {
          name: 'title',
          value: event.title === null ? { isNull: true } : { stringValue: event.title }
        },
        {
          name: 'description',
          value: event.description === null ? { isNull: true } : { stringValue: event.description }
        },
        {
          name: 'event_url',
          value: event.event_url === null ? { isNull: true } : { stringValue: event.event_url }
        },
        {
          name: 'start_time',
          value: event.start_time === null ? { isNull: true } : { stringValue: event.start_time }  
        },
        {
          name: 'end_time',
          value: event.end_time === null ? { isNull: true } : { stringValue: event.end_time }
        },
        {
          name: 'ticket_limit',
          value: event.ticket_limit === null ? { isNull: true } : { longValue: typeof event.ticket_limit === 'string' ? parseInt(event.ticket_limit) : event.ticket_limit }
        },
        {
          name: 'accepted',
          value: event.accepted === null ? { isNull: true } : { longValue: typeof event.accepted === 'string' ? parseInt(event.accepted) : event.accepted }
        },
        {
          name: 'waiting',
          value: event.waiting === null ? { isNull: true } : { longValue: typeof event.waiting === 'string' ? parseInt(event.waiting) : event.waiting }
        },
        {
          name: 'updated_at',
          value: event.updated_at === null ? { isNull: true } : { stringValue: event.updated_at }
        },
        {
          name: 'place',
          value: event.place === null ? { isNull: true } : { stringValue: event.place }
        },
        {
          name: 'address',
          value: event.address === null ? { isNull: true } : { stringValue: event.address }
        },
        {
          name: 'lat',
          value: event.lat === null ? { isNull: true } : { doubleValue: typeof event.lat === 'string' ? parseFloat(event.lat) : event.lat }
        },
        {
          name: 'lon',
          value: event.lon === null ? { isNull: true } : { doubleValue: typeof event.lon === 'string' ? parseFloat(event.lon) : event.lon }
        }
      ];
    });

    const rdsDataService = new RdsDataService(rdsClient);
    const transaction = await rdsDataService.beginTransaction(resourceArn, secret.ARN);
    if (!transaction.transactionId) {
      throw new Error('[ERROR] Failed to get Transaction ID');
    }

    const res = await rdsDataService.insertEvents(
      resourceArn,
      secret.ARN,
      INSERT_STRING + CONFLICT_STRING,
      parameterSets,
      transaction.transactionId
    );

    await rdsDataService.commitTransaction(resourceArn, secret.ARN, transaction.transactionId);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify(res)
    });
  } catch(e) {
    callback(new Error(e));
  }
}
