import "./globals.css";
import AuthProvider from "./components/AuthProvider";
import DisciplineWarning from "./components/DisciplineWarning";
import GlobalReload from "./components/GlobalReload";

export const metadata = {
  title: "TradeJournal Pro - Smart Trading Analytics",
  description: "Professional trading journal with advanced analytics, PnL tracking, and performance insights to improve your trading strategy.",
  keywords: "trading journal, PnL tracker, win rate, risk reward, trading analytics",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#0a0b0f" />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <DisciplineWarning />
          {children}
          <GlobalReload />
        </AuthProvider>
      </body>
    </html>
  );
}
