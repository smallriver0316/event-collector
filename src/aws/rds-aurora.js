'use strict';

module.exports = class RdsDataService {
  constructor(client) {
    this.client = client;
  }

  beginTransaction = async (resourceArn, secretArn) => {
    console.log('Start RdsDataService.beginTransaction');

    const params = {
      resourceArn,
      secretArn,
      database: process.env.DB_NAME
    };

    return new Promise((resolve, reject) => {
      this.client.beginTransaction(params, (err, data) => {
        if (err) {
          console.error('[ERROR] Failed to RdsDataService.beginTransaction');
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  commitTransaction = async (resourceArn, secretArn, transactionId) => {
    console.log('Start RdsDataService.commitTransaction');

    const params = {
      resourceArn,
      secretArn,
      transactionId
    };

    return new Promise((resolve, reject) => {
      this.client.commitTransaction(params, (err, data) => {
        if (err) {
          console.error('[ERROR] Failed to RdsDataService.commitTransaction');
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  executeSelectAll = async (resourceArn, secretArn) => {
    console.log('Start RdsDataService.executeSelectAll');

    const params = {
      resourceArn,
      secretArn,
      sql: `select * from ${process.env.TABLE_NAME}`,
      database: process.env.DB_NAME
    };

    return new Promise((resolve, reject) => {
      this.client.executeStatement(params, (err, data) => {
        if (err) {
          console.error('[ERROR] Failed to RdsDataService.executeSelectAll');
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  };

  insertEvents = async (resourceArn, secretArn, sqlStr, parameterSets, transactionId) => {
    console.log('Start RdsDataService.insertEvents');

    var params = {
      resourceArn,
      secretArn,
      sql: sqlStr,
      database: process.env.DB_NAME,
      parameterSets
    };
    if (transactionId) {
      params = {
        ...params,
        transactionId
      };
    }

    return new Promise((resolve, reject) => {
      this.client.batchExecuteStatement(params, (err, data) => {
        if (err) {
          console.error('[ERROR] Failed to RdsDataService.insertEvents');
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }
}
