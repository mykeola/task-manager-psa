import './globals.css';
import { AuthProvider } from '../lib/authContext';

export const metadata = {
  title: 'OmniTask AI — Multi-Tenant Task Management & ML Schedule Forecasting',
  description: 'University Project Assessment (PSA) integrating AI/ML effort prediction, multi-tenant software project management, and cybersecurity.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full bg-zinc-950 text-zinc-100 antialiased font-sans flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
