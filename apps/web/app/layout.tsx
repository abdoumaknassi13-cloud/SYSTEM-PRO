import type React from "react";

export const metadata = {
  title: "SYSTEM PRO",
  description: "TASK-01 foundation placeholder",
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
