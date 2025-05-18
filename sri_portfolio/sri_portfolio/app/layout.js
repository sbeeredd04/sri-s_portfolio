// Try to load environment variables in development mode
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config();
    console.log('Loaded environment variables from .env file');
  } catch (error) {
    console.warn('Failed to load dotenv:', error.message);
  }
}

// Import the global CSS and Google Fonts link
import "./globals.css";
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Ubuntu_Mono } from "next/font/google";
import { MusicProvider } from './components/MusicProvider';
import { SoundProvider } from './components/SoundProvider';
import './initialize-embeddings'; // Import the embeddings initialization script

const ubuntuMono = Ubuntu_Mono({ 
  weight: ['400', '700'],
  subsets: ["latin"],
  display: 'swap',
});

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
        url: 'https://www.sriujjwalreddy.com/logo.png', // Update this path to your logo
        width: 1200,
        height: 1200,
        alt: 'Sri Ujjwal Reddy Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  icons: {
    icon: '/logo.png', // Your favicon
    shortcut: '/logo.png',
    apple: '/logo.png',
    other: {
      rel: 'apple-touch-icon',
      url: '/logo.png',
    },
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sri Ujjwal Reddy',
    description: 'Software Engineer | ML Engineer | Full Stack Developer',
    images: ['https://www.sriujjwalreddy.com/logo.png'], // Update this path
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        {/* No need for extra link tag as we're using next/font/google */}
        <link rel="icon" type="image/png" href="/logo.png" />
      </head>
      <body className={ubuntuMono.className}>
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
