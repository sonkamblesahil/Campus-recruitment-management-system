import "./globals.css";
import AppShell from "../components/AppShell";

export const metadata = {
  title: "Campus Recruitment Management System",
  description:
    "Campus Recruitment Management System for students and placement administrators.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <body className="h-full overflow-hidden flex flex-col">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
