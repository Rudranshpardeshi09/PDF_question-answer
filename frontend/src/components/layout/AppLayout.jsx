import { Separator } from "@/components/ui/separator";
import ThemeToggle from "./ThemeToggle";

export default function AppLayout({ children }) {
  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <header className="h-14 flex items-center px-6 border-b">
        <h1 className="font-semibold text-lg">📄 PDF RAG Assistant</h1>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      <Separator />

      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
