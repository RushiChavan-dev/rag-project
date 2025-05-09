import React, { useState } from "react";
import { useImmer } from "use-immer";
import ChatMessages from "../components/ChatMessages";
import ChatInput from "../components/ChatInput";
import api from "../api";
import { parseSSEStream } from "../utils"; // Make sure this exists or create one

export default function OcrPage() {
  const [messages, setMessages] = useImmer([]);
  const [newMessage, setNewMessage] = useState("");

  const isLoading = messages.length && messages[messages.length - 1].loading;

  // 🔁 This handles input query via ChatInput → /api/query/
  async function submitNewMessage() {
    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage || isLoading) return;

    setMessages((draft) => [
      ...draft,
      { role: "user", content: trimmedMessage },
      { role: "assistant", content: "", loading: true },
    ]);
    setNewMessage("");

    try {
      const stream = await api.queryRAG(trimmedMessage, 3);

      for await (const textChunk of parseSSEStream(stream)) {
        try {
          const data = JSON.parse(textChunk);

          if (data.response) {
            setMessages((draft) => {
              draft[draft.length - 1].content += data.response;
            });
          }

          if (data.metadata) {
            console.log("Metadata:", data.metadata);
          }
        } catch (err) {
          console.error("Error parsing JSON chunk:", err);
        }
      }

      setMessages((draft) => {
        draft[draft.length - 1].loading = false;
      });
    } catch (err) {
      console.error("Error fetching response:", err);
      setMessages((draft) => {
        draft[draft.length - 1].loading = false;
        draft[draft.length - 1].content = "Error fetching response.";
      });
    }
  }

  // 🧠 This handles demand letter generation → /api/demand-letter/
  async function handleGenerateDemandLetter() {
    setMessages((draft) => [
      ...draft,
      { role: "user", content: "Generate a demand letter" },
      { role: "assistant", content: "", loading: true },
    ]);

    try {
      const stream = await api.generateDemandLetter("q", 5);

      console.log(stream);
      for await (const textChunk of parseSSEStream(stream)) {
        try {
          const data = JSON.parse(textChunk);

          if (data.response) {
            console.log("🔹 Demand Letter Chunk:", data.response); // ✅ log each streamed chunk

            setMessages((draft) => {
              draft[draft.length - 1].content += data.response;
            });
          }

          if (data.metadata) {
            console.log("📦 Demand Letter Metadata:", data.metadata); // ✅ log metadata at end
          }
        } catch (err) {
          console.error("❌ Error parsing streamed chunk:", err);
        }
      }

      setMessages((draft) => {
        draft[draft.length - 1].loading = false;
      });
    } catch (err) {
      console.error("❌ Failed to stream demand letter:", err);
      setMessages((draft) => {
        draft[draft.length - 1].loading = false;
        draft[draft.length - 1].content =
          "❌ Failed to generate demand letter.";
      });
    }
  }

  return (
    <div className="relative grow flex flex-col gap-6 pt-6">
      {messages.length === 0 && (
        <div className="mt-3 font-urbanist text-primary-blue text-xl font-light space-y-2">
          <p>👋 Welcome!</p>
          <p>I am powered by the latest technology.</p>
          <p>Ask me anything about the uploaded pdf.</p>
        </div>
      )}

      {/* 🔘 Button to generate the demand letter */}
      <div className="mb-4">
        <button
          onClick={handleGenerateDemandLetter}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          Generate Demand Letter
        </button>
      </div>

      <ChatMessages messages={messages} isLoading={isLoading} />

      <ChatInput
        newMessage={newMessage}
        isLoading={isLoading}
        setNewMessage={setNewMessage}
        submitNewMessage={submitNewMessage}
      />
    </div>
  );
}
