
import { Suspense } from "react";
import ConversationClient from "./ConversationClient";
import "./conversation.css";
import Navbar from "../../components/Navbar/Navbar";

export default function ConversationPage() {
  return (
    <>
      <Navbar />

      <Suspense
        fallback={
          <main style={{ padding: 32 }}>
            Loading conversation...
          </main>
        }
      >
        <ConversationClient />
      </Suspense>
    </>
  );
}
