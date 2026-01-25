import AppLayout from "@/components/layout/AppLayout";
import UploadPDF from "@/components/upload/UploadPDF";
import ChatWindow from "@/components/chat/ChatWindow";

export default function Home() {
  return (
    <AppLayout>
      <div className="grid grid-cols-3 gap-6 h-full p-6">
        <UploadPDF />
        <div className="col-span-2 border rounded-xl p-4">
          <ChatWindow />
        </div>
      </div>
    </AppLayout>
  );
}
