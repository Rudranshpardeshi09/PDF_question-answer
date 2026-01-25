import { ScrollArea } from "@/components/ui/scroll-area";
import { askQuestion } from "@/api/client";
import { useApp } from "@/context/AppContext";
import MessageBubble from "./MessageBubble";
import SourcesPanel from "./SourcesPanel";
import ChatInput from "./ChatInput";

export default function ChatWindow() {
  const { indexed, messages, setMessages } = useApp();

  const sendQuestion = async (q) => {
    setMessages((m) => [...m, { role: "user", content: q }]);
    const res = await askQuestion(q);

    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        content: res.data.answer,
        sources: res.data.sources,
      },
    ]);
  };

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div key={i}>
              <MessageBubble role={m.role} content={m.content} />
              {m.sources && <SourcesPanel sources={m.sources} />}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="pt-4">
        <ChatInput onSend={sendQuestion} disabled={!indexed} />
      </div>
    </div>
  );
}
