/**
 * Extracts a robust, user-friendly error message from Axios errors or standard Javascript errors.
 * 
 * @param {any} err - The error object caught in try-catch.
 * @param {string} fallbackMsg - The default message to show if extraction fails.
 * @returns {string} The parsed error message.
 */
export const getErrorMessage = (err, fallbackMsg = 'An error occurred') => {
  if (err && err.response) {
    const data = err.response.data;
    if (data) {
      // If the response is a raw string
      if (typeof data === 'string') {
        if (data.trim().startsWith('<')) {
          return `Request failed with status code ${err.response.status}`;
        }
        return data;
      }
      // If response is JSON and has a "message" field
      if (data.message) {
        return data.message;
      }
      // If response is JSON and has an "error" field
      if (data.error) {
        return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
      }
      // If response contains validation or multiple errors
      if (data.errors) {
        if (Array.isArray(data.errors)) {
          return data.errors.map(e => e.message || JSON.stringify(e)).join(', ');
        }
        if (typeof data.errors === 'object') {
          return Object.values(data.errors)
            .map(e => Array.isArray(e) ? e.join(', ') : (e.message || JSON.stringify(e)))
            .join(', ');
        }
      }
    }
    // Fallback based on HTTP status code
    if (err.response.statusText) {
      return `${err.response.statusText} (${err.response.status})`;
    }
    return `Request failed with status code ${err.response.status}`;
  }
  
  if (err && err.message) {
    return err.message;
  }
  
  return fallbackMsg;
};

export default getErrorMessage;
