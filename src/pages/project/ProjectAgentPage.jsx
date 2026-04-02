import { useParams } from "react-router-dom";
import ChatbotPage from "@/features/chatbot/pages/ChatbotPage";

export default function ProjectAgentPage() {
  const { projectId } = useParams();

  return <ChatbotPage projectId={projectId} />;
}
