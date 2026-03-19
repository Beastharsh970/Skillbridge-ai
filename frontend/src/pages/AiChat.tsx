import { useEffect, useState, useRef } from "react";
import {
  Send, Bot, User as UserIcon, Plus, Trash2, MessageCircle,
  Sparkles, Clock, ArrowLeft,
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/cn";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

interface ChatSummary {
  _id: string;
  title: string;
  messageCount: number;
  lastMessage: string;
  updatedAt: string;
}

function MarkdownContent({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*|\n- |\n\d+\. |\n)/g);

  return (
    <div className="text-sm leading-relaxed space-y-1">
      {content.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;

        let formatted = line
          .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/`(.+?)`/g, '<code class="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">$1</code>');

        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <div key={i} className="flex items-start gap-2 pl-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span dangerouslySetInnerHTML={{ __html: formatted.replace(/^[-•]\s*/, "") }} />
            </div>
          );
        }

        if (/^\d+\.\s/.test(line)) {
          return (
            <div key={i} className="flex items-start gap-2 pl-2">
              <span className="shrink-0 text-xs font-bold text-primary mt-0.5">{line.match(/^\d+/)?.[0]}.</span>
              <span dangerouslySetInnerHTML={{ __html: formatted.replace(/^\d+\.\s*/, "") }} />
            </div>
          );
        }

        if (line.startsWith("###")) {
          return <h4 key={i} className="font-semibold text-foreground mt-2" dangerouslySetInnerHTML={{ __html: formatted.replace(/^#{1,3}\s*/, "") }} />;
        }
        if (line.startsWith("##")) {
          return <h3 key={i} className="font-bold text-foreground mt-3 text-base" dangerouslySetInnerHTML={{ __html: formatted.replace(/^#{1,2}\s*/, "") }} />;
        }

        return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />;
      })}
    </div>
  );
}

export default function AiChat() {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchChats = async () => {
    try {
      const { data } = await api.get("/chat");
      setChats(data.chats);
    } catch { /* silent */ }
  };

  const loadChat = async (id: string) => {
    try {
      const { data } = await api.get(`/chat/${id}`);
      setActiveChatId(id);
      setMessages(data.chat.messages);
      setShowSidebar(false);
    } catch { /* silent */ }
  };

  const startNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setShowSidebar(false);
    inputRef.current?.focus();
  };

  const deleteChat = async (id: string) => {
    try {
      await api.delete(`/chat/${id}`);
      setChats(chats.filter((c) => c._id !== id));
      if (activeChatId === id) startNewChat();
    } catch { /* silent */ }
  };

  const sendMessage = async () => {
    const msg = input.trim();
    if (!msg || sending) return;

    setInput("");
    const userMsg: ChatMessage = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const { data } = await api.post("/chat/send", {
        chatId: activeChatId || undefined,
        message: msg,
      });

      if (!activeChatId) {
        setActiveChatId(data.chatId);
        fetchChats();
      }

      const assistantMsg: ChatMessage = { role: "assistant", content: data.reply };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: `Sorry, I encountered an error: ${err.response?.data?.error || "Please try again."}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestions = [
    "What skills should I learn next based on my profile?",
    "How can I transition into a senior developer role?",
    "What are the top-paying tech skills in 2026?",
    "Help me prepare for a system design interview",
    "Review my skill set and suggest improvements",
    "What projects should I build to strengthen my portfolio?",
  ];

  return (
    <div className="flex h-[calc(100vh-5rem)] -m-6 overflow-hidden">
      {/* Chat History Sidebar */}
      {showSidebar && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setShowSidebar(false)} />
      )}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-card flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0",
        showSidebar ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-semibold text-sm">Chat History</h2>
          <button
            onClick={startNewChat}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" /> New
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chats.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">No conversations yet</p>
          )}
          {chats.map((c) => (
            <div
              key={c._id}
              className={cn(
                "group flex items-start gap-2 rounded-lg p-2.5 cursor-pointer transition-all",
                activeChatId === c._id ? "bg-primary/10" : "hover:bg-accent"
              )}
            >
              <button onClick={() => loadChat(c._id)} className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">{c.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {c.messageCount} messages · {new Date(c.updatedAt).toLocaleDateString()}
                </p>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); deleteChat(c._id); }}
                className="shrink-0 p-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 shrink-0">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="rounded-lg p-2 hover:bg-accent lg:hidden"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="hidden lg:flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            <Clock className="h-3.5 w-3.5" />
            History ({chats.length})
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold truncate">SkillBridge AI Advisor</span>
          </div>
          <button
            onClick={startNewChat}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            <Plus className="h-3.5 w-3.5" /> New Chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">SkillBridge AI Advisor</h2>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-8">
                I have context of your resume, GitHub, and skills. Ask me anything about career growth, skill development, or job preparation.
              </p>
              <div className="grid gap-2 sm:grid-cols-2 max-w-xl w-full">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); inputRef.current?.focus(); }}
                    className="rounded-xl border border-border p-3 text-left text-sm text-muted-foreground hover:border-primary/30 hover:bg-accent/50 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "")}>
                  {msg.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-0.5">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border border-border rounded-bl-md"
                  )}>
                    {msg.role === "user" ? (
                      <p className="text-sm">{msg.content}</p>
                    ) : (
                      <MarkdownContent content={msg.content} />
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted mt-0.5">
                      <UserIcon className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {sending && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-0.5">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border p-4 shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about careers, skills, interviews, learning paths..."
                  rows={1}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 text-sm outline-none resize-none focus:border-primary focus:ring-2 focus:ring-primary/20 max-h-32"
                  style={{ minHeight: "44px" }}
                  onInput={(e) => {
                    const t = e.currentTarget;
                    t.style.height = "auto";
                    t.style.height = Math.min(t.scrollHeight, 128) + "px";
                  }}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:bg-primary/90",
                  (!input.trim() || sending) && "opacity-50 cursor-not-allowed"
                )}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              AI advisor with context of your resume & GitHub. Only answers career-related questions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
