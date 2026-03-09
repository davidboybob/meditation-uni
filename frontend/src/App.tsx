import { useState } from "react";
import HomeScreen from "./pages/HomeScreen";
import FineCalculator from "./pages/FineCalculator";

export default function App() {
  const [tab, setTab] = useState<"home" | "fine">("home");

  return (
    <div>
      {tab === "home" ? <HomeScreen /> : <FineCalculator />}
      <nav className="fixed bottom-0 left-0 right-0 flex border-t" style={{ background: "#0f2318", borderColor: "#2d6a4f" }}>
        <button
          onClick={() => setTab("home")}
          className="flex-1 py-3 text-sm font-medium transition"
          style={{ color: tab === "home" ? "#74c69d" : "#888" }}
        >
          📖 홈
        </button>
        <button
          onClick={() => setTab("fine")}
          className="flex-1 py-3 text-sm font-medium transition"
          style={{ color: tab === "fine" ? "#74c69d" : "#888" }}
        >
          💰 벌금
        </button>
      </nav>
      <div className="h-14" />
    </div>
  );
}
