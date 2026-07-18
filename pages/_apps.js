// pages/_app.js
import { Analytics } from "@vercel/analytics/next"; // Import the Analytics component

// Import global CSS file
import '../styles/globals.css'; // Ensure this path is correct based on your project structure

function MyApp({ Component, pageProps }) {
  return (
    <>
      {/* Render the page component */}
      <Component {...pageProps} />

      {/* Add the Vercel Analytics component for tracking */}
      <Analytics />
    </>
  );
}

export default MyApp;
