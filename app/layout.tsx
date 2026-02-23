import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "VeoGen - TikTok Videos That Sell",
    description: "Turn any product into a ready-to-post TikTok in under 2 minutes. No filming, no editing, no VAs.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
            </head>
            <body>{children}</body>
        </html>
    );
}
