import React, { useState, useEffect } from "react";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("gpt"); // 'gpt' or 'gemini'

  const fetchMessages = async () => {
    const res = await fetch("http://localhost:8000/messages");
    const data = await res.json();
    setMessages(data);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const isImageRequest = input.startsWith("@image");

    const targetURL = isImageRequest
      ? "http://localhost:8000/unified"
      : model === "gpt"
      ? "http://localhost:8000/messages"
      : "http://localhost:8000/gemini";

    const payload = isImageRequest
      ? { message: input, model }
      : { message: input };

    try {
      const res = await fetch(targetURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      const lastMessage = data[data.length - 1]?.message || "⚠️ 응답 없음";

      setMessages((prev) => [
        ...prev,
        { role: "user", message: input },
        { role: model, message: lastMessage },
      ]);

      setInput("");
    } catch (error) {
      alert("❌ 서버와 통신 중 오류 발생!");
      console.error(error);
    }
  };

  return (
    <div style={{ padding: 30, fontFamily: "Arial, sans-serif" }}>
      <h2>GPT or Gemini</h2>

      {/* 선택 버튼 */}
      <div style={{ marginBottom: 15, display: "flex", gap: 10 }}>
        <button
          onClick={() => setModel("gpt")}
          style={{
            padding: "8px 16px",
            fontSize: 16,
            borderRadius: 6,
            border:
              model === "gpt" ? "2px solid #0049b7" : "1px solid lightgray",
            backgroundColor: "#007bff",
            color: "#fff",
            cursor: "pointer",
            opacity: model === "gpt" ? 1 : 0.5,
          }}
        >
          GPT
        </button>
        <button
          onClick={() => setModel("gemini")}
          style={{
            padding: "8px 16px",
            fontSize: 16,
            borderRadius: 6,
            border:
              model === "gemini" ? "2px solid #1c7c4c" : "1px solid lightgray",
            backgroundColor: "#7fe088",
            color: "#000",
            cursor: "pointer",
            opacity: model === "gemini" ? 1 : 0.5,
          }}
        >
          Gemini
        </button>
      </div>

      {/* 입력창 */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="sth anything..."
          style={{
            width: "60%",
            padding: 10,
            fontSize: 16,
            marginRight: 10,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: "10px 20px",
            fontSize: 16,
            borderRadius: 6,
            backgroundColor: "#333",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          send
        </button>
      </div>

      {/* 메시지 출력 */}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {messages.map((msg, idx) => (
          <li
            key={idx}
            style={{
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "#f9f9f9",
              padding: "8px 12px",
              borderRadius: "10px",
            }}
          >
            {msg.role === "user" && (
              <>
                <img
                  src="https://cdn-icons-png.flaticon.com/512/747/747376.png"
                  alt="User"
                  style={{ width: 20, height: 20 }}
                />
                <span>
                  <strong>You:</strong> {msg.message}
                </span>
              </>
            )}
            {msg.role === "gpt" && (
              <>
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg"
                  alt="GPT"
                  style={{ width: 20, height: 20 }}
                />
                <span>
                  <strong>GPT:</strong>
                </span>
                <span>
                  {msg.message.includes("http") ? (
                    <>
                      <p>{msg.message.split("\n")[0]}</p>
                      <img
                        src={msg.message.split("\n")[1]}
                        alt="Generated"
                        style={{ width: 200, borderRadius: 8 }}
                      />
                    </>
                  ) : (
                    msg.message
                  )}
                </span>
              </>
            )}
            {msg.role === "gemini" && (
              <>
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg"
                  alt="Gemini"
                  style={{ width: 20, height: 20 }}
                />
                <span>
                  <strong>Gemini:</strong>
                </span>
                <span>
                  {msg.message.includes("http") ? (
                    <>
                      <p>{msg.message.split("\n")[0]}</p>
                      <img
                        src={msg.message.split("\n")[1]}
                        alt="Generated"
                        style={{ width: 200, borderRadius: 8 }}
                      />
                    </>
                  ) : (
                    msg.message
                  )}
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
