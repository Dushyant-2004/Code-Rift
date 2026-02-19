import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "CodeRift — AI Code Review Platform",
  description: "Get instant AI-powered code reviews with detailed analysis, bug detection, and optimization suggestions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans">
        <AuthProvider>
          <ProtectedRoute>
            <Navbar />
            <main className="pt-16 min-h-screen">{children}</main>
          </ProtectedRoute>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#1e293b",
                color: "#e2e8f0",
                border: "1px solid rgba(255,255,255,0.05)",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
