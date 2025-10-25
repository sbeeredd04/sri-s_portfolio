// Try to load environment variables in development mode
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config();
    console.log('Loaded environment variables from .env file');
  } catch (error) {
    console.warn('Failed to load dotenv:', error.message);
  }
}

// Import the global CSS
import "./globals.css";
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { MusicProvider } from './components/MusicProvider';
import { SoundProvider } from './components/SoundProvider';

export const metadata = {
  title: "Sri Ujjwal Reddy",
  description: "Software Engineer | ML Engineer | Full Stack Developer",
  openGraph: {
    title: 'Sri Ujjwal Reddy',
    description: 'Software Engineer | ML Engineer | Full Stack Developer',
    url: 'https://www.sriujjwalreddy.com',
    siteName: 'Sri Ujjwal Reddy',
    images: [
      {
        url: 'https://www.sriujjwalreddy.com/logos/logo.png',
        width: 1200,
        height: 1200,
        alt: 'Sri Ujjwal Reddy Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  icons: {
    icon: '/logos/logo.png',
    shortcut: '/logos/logo.png',
    apple: '/logos/logo.png',
    other: {
      rel: 'apple-touch-icon',
      url: '/logos/logo.png',
    },
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sri Ujjwal Reddy',
    description: 'Software Engineer | ML Engineer | Full Stack Developer',
    images: ['https://www.sriujjwalreddy.com/logos/logo.png'],
  },
};

// Fix: Move viewport settings to a separate export
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/logos/logo.png" />
      </head>
      <body>
        <SoundProvider>
          <MusicProvider>
            {children}
          </MusicProvider>
        </SoundProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
