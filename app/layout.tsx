export const metadata = {
  title: 'Sannata Portal',
  description: 'Creative portal'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
