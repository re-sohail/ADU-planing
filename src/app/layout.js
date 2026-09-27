import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { PlannerProvider } from "@/context/PlannerContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "ADU Planner | Pacific Manufactured Homes",
  description: "See how an ADU fits on your property and book a free consultation.",
};

export default function RootLayout({ children }) {
  // Browser extensions such as password managers and antivirus add attributes to html and body before React hydrates.
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        <PlannerProvider>
          {children}
          <Toaster position="bottom-right" />
        </PlannerProvider>
      </body>
    </html>
  );
}
