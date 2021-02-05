'use strict';

module.exports = class SecretsManager {
  constructor(client) {
    this.client = client;
  }

  getSecretValue = async (secretId) => {
    const params = {
      SecretId: secretId
    };

    return new Promise((resolve, reject) => {
      this.client.getSecretValue(params, (err, data) => {
        if (err) {
          console.error("Failed to SecretsManager.getSecretValue");
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }
}
