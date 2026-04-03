import { useParams } from "react-router-dom";
import ChatbotPage from "@/features/chatbot/pages/ChatbotPage";

export default function ProjectAgentPage() {
  const { projectId } = useParams();

  return (
    <div className="h-full min-h-0 overflow-hidden">
      <ChatbotPage projectId={projectId} />
    </div>
  );
}
