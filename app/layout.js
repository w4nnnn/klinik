import "./globals.css";

export const metadata = {
  title: "Demo Klinik App",
  description: "A simple clinic queue management application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
