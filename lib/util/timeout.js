class KnexTimeoutError extends Error {
  constructor(message, connections) {
    if (connections) {
      try {
        message += '\nLast queries on all active connections:\n';
        for (let i = 0; i < connections.length; i++) {
          let details = `${i}: `;
          const lastQuery = connections[i].__knexLastQuery;
          if (lastQuery) {
            details += `${lastQuery.sql}\n\twith bindings: ${JSON.stringify(
              lastQuery.bindings
            )}\n`;
          } else {
            details += '(no last query?)\n';
          }
          message += details;
        }
      } catch (e) {
        message += `\nCould not add connection details: ${e.stack}`;
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
