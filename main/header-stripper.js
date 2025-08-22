const {session} = require('electron');

/**
 * Attaches a web request listener to a specific session partition to strip
 * headers that prevent content from being displayed in a <webview>.
 * @param {string} partitionName The name of the session partition (e.g., "persist:chrome3").
 */
function setupHeaderStripping(partitionName) {
  if (!partitionName) {
    console.error('[HeaderStripper] A partition name must be provided.');
    return;
  }

  try {
    const ses = session.fromPartition(partitionName);
    console.log(`[HeaderStripper] Attaching to partition: ${partitionName}`);

    const filter = {
      urls: ['*://*/*'],
    };

    ses.webRequest.onHeadersReceived(filter, (details, callback) => {
      if (details.responseHeaders) {
        // Create a mutable copy of the response headers
        const headers = {...details.responseHeaders};

        // Find and delete headers case-insensitively, as requested.
        const headersToDelete = ['x-frame-options', 'content-security-policy'];
        for (const key in headers) {
          if (headersToDelete.includes(key.toLowerCase())) {
            delete headers[key];
          }
        }

        // The callback expects an object with a `responseHeaders` property.
        callback({responseHeaders: headers});
      } else {
        // If there are no headers, just continue.
        callback({});
      }
    });

    console.log(
      `[HeaderStripper] Successfully attached web request listener to partition: ${partitionName}`,
    );
  } catch (error) {
    console.error(
      `[HeaderStripper] Failed to attach to session for partition ${partitionName}:`,
      error,
    );
  }
}

module.exports = {setupHeaderStripping};
