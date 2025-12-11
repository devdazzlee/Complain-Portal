import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AppProvider } from "./context/AppContext";
import { LoadingProvider } from "./context/LoadingContext";
import PageLoader from "./components/PageLoader";

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Legacy HR Client Complaint Portal",
  description: "Legacy HR Client Complaint Portal System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} antialiased`}
      >
        <AppProvider>
          <LoadingProvider>
            <PageLoader />
            {children}
          </LoadingProvider>
        </AppProvider>
      </body>
    </html>
  );
}
