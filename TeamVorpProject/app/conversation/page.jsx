
import { Suspense } from "react";
import ConversationClient from "./ConversationClient";
import "./conversation.css";

export default function ConversationPage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: 32 }}>
          Loading conversation...
        </main>
      }
    >
      <ConversationClient />
    </Suspense>
  );
}
