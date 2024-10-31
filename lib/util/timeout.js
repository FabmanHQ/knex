class KnexTimeoutError extends Error {
  constructor(message, connections) {
    if (connections) {
      message += '\nLast queries on all active connections:\n';
      for (let i = 0; i < connections.length; i++) {
        let details = `${i}: `;
        try {
          const c = connections[i];
          const lastQuery = c.__knexLastQuery;
          if (lastQuery) {
            details += `${lastQuery.sql}\n\twith bindings: ${JSON.stringify(
              lastQuery.bindings
            )}, transaction: ${c.__knexTxId}\n`;
          } else {
            details += '(no last query?)\n';
          }
        } catch (e) {
          details += `error while adding connection details: ${e.stack}\n`;
        }
        message += details;
      }
    }
    super(message);
    this.name = 'KnexTimeoutError';
    this.connections = connections;
  }
}

function timeout(promise, ms) {
  return new Promise(function (resolve, reject) {
    const id = setTimeout(function () {
      reject(new KnexTimeoutError('operation timed out'));
    }, ms);

    function wrappedResolve(value) {
      clearTimeout(id);
      resolve(value);
    }

    function wrappedReject(err) {
      clearTimeout(id);
      reject(err);
    }

    promise.then(wrappedResolve, wrappedReject);
  });
}

module.exports.KnexTimeoutError = KnexTimeoutError;
module.exports.timeout = timeout;
