import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ChatInput({ onSend, disabled }) {
  let text = "";

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Ask something about the document…"
        disabled={disabled}
        onChange={(e) => (text = e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSend(text)}
      />
      <Button disabled={disabled} onClick={() => onSend(text)}>
        Send
      </Button>
    </div>
  );
}
