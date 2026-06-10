import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useOrg } from "../../hooks/useOrg";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { format, isToday, isYesterday } from "date-fns";
import toast from "react-hot-toast";

export default function ProjectChat() {
  const { orgId, projectId } = useParams();
  const { user } = useAuth();
  const { role, org } = useOrg();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [memberNames, setMemberNames] = useState({});
  const bottomRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    const q = query(
      collection(db, `projects/${projectId}/chat`),
      orderBy("timestamp", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
      fetchMemberNames(msgs);
    });
    return () => unsub();
  }, [projectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchProject = async () => {
    try {
      const snap = await getDoc(doc(db, "projects", projectId));
      if (snap.exists()) setProjectName(snap.data().name || "Project");
    } catch (e) {}
  };

  const fetchMemberNames = async (msgs) => {
    const unknownIds = msgs
      .map((m) => m.userId)
      .filter((id) => id && !memberNames[id]);
    const uniqueIds = [...new Set(unknownIds)];
    if (uniqueIds.length === 0) return;

    const updates = {};
    for (const uid of uniqueIds) {
      try {
        const snap = await getDoc(doc(db, `organizations/${orgId}/members`, uid));
        updates[uid] = snap.exists() ? snap.data().displayName || snap.data().email || uid.slice(0, 8) : uid.slice(0, 8);
      } catch (e) {
        updates[uid] = uid.slice(0, 8);
      }
    }
    setMemberNames((prev) => ({ ...prev, ...updates }));
  };

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text) return;
    setSending(true);
    try {
      await addDoc(collection(db, `projects/${projectId}/chat`), {
        userId: user.uid,
        displayName: user.displayName || user.email || "User",
        message: text,
        timestamp: serverTimestamp(),
        role: role,
      });
      setNewMessage("");
      inputRef.current?.focus();
    } catch (e) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getDateLabel = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "dd MMM yyyy");
  };

  // Group messages by date
  const groupedMessages = messages.reduce((acc, msg) => {
    const label = getDateLabel(msg.timestamp);
    if (!acc[label]) acc[label] = [];
    acc[label].push(msg);
    return acc;
  }, {});

  const roleColor = (r) => {
    if (r === "manager") return "bg-blue-100 text-blue-700";
    if (r === "assistant_manager") return "bg-purple-100 text-purple-700";
    return "bg-gray-100 text-gray-600";
  };

  const roleLabel = (r) => {
    if (r === "manager") return "Manager";
    if (r === "assistant_manager") return "Asst. Mgr";
    return "Employee";
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
        <h1 className="font-bold text-gray-800 text-lg">{projectName} — Daily Log</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Team members can post daily remarks, material arrivals, and site updates here
        </p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {Object.keys(groupedMessages).length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="font-semibold text-gray-600 text-lg">No messages yet</h3>
            <p className="text-gray-400 text-sm mt-2 max-w-xs">
              Start logging daily site updates, material deliveries, and remarks here.
            </p>
          </div>
        )}

        {Object.entries(groupedMessages).map(([dateLabel, msgs]) => (
          <div key={dateLabel}>
            {/* Date divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                {dateLabel}
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Messages */}
            <div className="space-y-3">
              {msgs.map((msg) => {
                const isMe = msg.userId === user?.uid;
                const name = msg.displayName || memberNames[msg.userId] || "User";
                const time = msg.timestamp?.toDate
                  ? format(msg.timestamp.toDate(), "hh:mm a")
                  : "";

                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs md:max-w-md ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                      {/* Name + role */}
                      {!isMe && (
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-xs font-semibold text-gray-600">{name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor(msg.role)}`}>
                            {roleLabel(msg.role)}
                          </span>
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                          isMe
                            ? "bg-blue-600 text-white rounded-br-sm"
                            : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"
                        }`}
                      >
                        {msg.message}
                      </div>

                      {/* Time */}
                      <span className="text-xs text-gray-400 mt-1 px-1">{time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 shadow-up">
        <div className="flex items-end gap-3 max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a remark… (e.g. Cement truck arrived with 50 bags)"
            rows={2}
            className="flex-1 resize-none border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
          />
          <button
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 text-white rounded-2xl w-12 h-12 flex items-center justify-center transition-colors flex-shrink-0 shadow-md"
          >
            {sending ? (
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22l-4-9-9-4 20-7z" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
