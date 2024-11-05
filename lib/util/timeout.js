class KnexTimeoutError extends Error {
  constructor(message, activeConnections, idleConnections) {
    if (activeConnections) {
      message += `\nLast queries on ${activeConnections.length} active connections:\n`;
      message += describeConnections(activeConnections);
    }
    if (idleConnections) {
      message += `\nLast queries on ${idleConnections.length} idle connections:\n`;
      message += describeConnections(idleConnections);
    }
    super(message);
    this.name = 'KnexTimeoutError';
    this.connections = [...activeConnections, ...idleConnections];
  }
}

function describeConnections(connections) {
  let message = '';
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
  return message;
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
