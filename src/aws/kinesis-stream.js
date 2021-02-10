'use strict';

module.exports = class KinesisStream {
  constructor(client) {
    this.client = client;
  }

  putRecord = async (event) => {
    console.log('Start KinesisSream.putRecord');

    const params = {
      Data: JSON.stringify(event),
      PartitionKey: '123',
      StreamName: process.env.KINESIS_STREAM_NAME
    };

    return new Promise((resolve, reject) => {
      this.client.putRecord(params, (err, data) => {
        if (err) {
          console.error('[ERROR] Failed to kinesis.putRecord');
          reject(err);
        } else {
          console.log('Succeeded to kinesis.putRecord');
          resolve(data);
        }
      });
    })
  }

  putRecords = async (events) => {
    console.log('Start KinesisSream.putRecords');
  
    if (!Array.isArray(events)) {
      throw new Error('argument events must be array');
    }

    const records = events.map(event => {
      return {
        Data: JSON.stringify(event),
        PartitionKey: '123'
      };
    });

    const params = {
      Records: records,
      StreamName: process.env.KINESIS_STREAM_NAME
    };

    return new Promise((resolve, reject) => {
      this.client.putRecords(params, (err, data) => {
        if (err) {
          console.error('[ERROR] Failed to kinesis.putRecords');
          reject(err);
        } else {
          console.log('Succeeded to kinesis.putRecords');
          resolve(data);
        }
      })
    });
  }
}
