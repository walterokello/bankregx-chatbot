// lib/logging.js

export const logError = (error) => {
  if (process.env.NODE_ENV === 'development') {
    // In development, log errors to the console
    console.error('🚨 Development Error:', error);
  } else {
    // In production, log errors to a logging service or store them in a file
    // Example: Send error to Sentry or LogRocket
    // Sentry.captureException(error); // Uncomment if you have Sentry
    // Alternatively, send it to a backend API that logs errors
    console.error('🚨 Production Error:', error);
  }
};

export const logErrorToBackend = async (error) => {
  try {
    const response = await fetch('/api/error-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message, stack: error.stack }),
    });
    if (!response.ok) {
      console.error('Failed to log error to backend');
    }
  } catch (err) {
    console.error('Failed to send error to backend', err);
  }
};
