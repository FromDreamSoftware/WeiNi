import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export default function AiChatPanel() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [open, setOpen] = useState(false);
  const welcomeMsg: Message = {
    role: 'ai',
    content: '嗨！我是小喂~ 可以陪你们聊天、讲笑话、给感情建议哦 💕',
  };
  const [messages, setMessages] = useState<Message[]>([welcomeMsg]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const heartRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const didDrag = useRef(false);
  const startPos = useRef({ x: 0, y: 0, left: 0, top: 0 });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('/api/ai/messages', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: { role: string; content: string }[] = await res.json();
          if (data.length > 0) {
            setMessages(data.map((m) => ({ role: m.role as 'user' | 'ai', content: m.content })));
          }
        }
      } catch {
        // keep welcome message
      }
    };
    if (isAuthenticated) loadHistory();
  }, [isAuthenticated]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);
    setStreaming('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/ai/chat?message=${encodeURIComponent(userMsg)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let aiContent = '';
      let buffer = '';
      let currentEvent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.substring(6).trim();
          } else if (line.startsWith('data:')) {
            const data = line.substring(5).trim();
            if (currentEvent === 'chunk' && data) {
              aiContent += data;
              setStreaming(aiContent);
            } else if (currentEvent === 'done') {
              const finalContent = aiContent;
              setMessages(prev => [...prev, { role: 'ai', content: finalContent }]);
              setStreaming('');
              aiContent = '';
            } else if (currentEvent === 'error') {
              setMessages(prev => [...prev, { role: 'ai', content: data || '出错了~' }]);
              setStreaming('');
            }
            currentEvent = '';
          }
        }
      }

      if (aiContent) {
        setMessages(prev => [...prev, { role: 'ai', content: aiContent }]);
        setStreaming('');
      }
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: '小喂走神了，稍后再试~' }]);
      setStreaming('');
    } finally {
      setLoading(false);
    }
  };

  const onHeartDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const heart = heartRef.current;
    if (!heart) return;
    const rect = heart.getBoundingClientRect();
    dragging.current = true;
    didDrag.current = false;
    startPos.current = { x: e.clientX, y: e.clientY, left: rect.left, top: rect.top };
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      if (!(e.buttons & 1)) { dragging.current = false; return; }
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      if (!didDrag.current && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        didDrag.current = true;
      }
      if (!didDrag.current) return;
      const heart = heartRef.current;
      if (!heart) return;
      heart.style.left = `${startPos.current.left + dx}px`;
      heart.style.top = `${startPos.current.top + dy}px`;
      heart.style.right = 'auto';
      heart.style.bottom = 'auto';
    };
    const onUp = () => {
      if (dragging.current && !didDrag.current) setOpen(prev => !prev);
      dragging.current = false;
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, []);

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Draggable heart */}
      <div
        ref={heartRef}
        onMouseDown={onHeartDown}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 flex items-center justify-center
                   bg-gradient-to-br from-pink-400 to-pink-500 rounded-full cursor-grab
                   active:cursor-grabbing shadow-lg shadow-pink-300/50 select-none"
        style={{ touchAction: 'none' }}
      >
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 drop-shadow-sm">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </motion.div>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-80 max-w-[calc(100vw-3rem)] bg-surface rounded-2xl shadow-xl
                       flex flex-col overflow-hidden"
            style={{ height: '420px', maxHeight: '60vh' }}
          >
            <div className="bg-pink-400 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">💕</span>
                <span className="text-sm font-medium">小喂 · AI助手</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/80 hover:text-white text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-pink-400 text-white rounded-br-md'
                      : 'bg-surface-tertiary text-text-primary rounded-bl-md'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {streaming && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] px-3 py-2 rounded-2xl rounded-bl-md bg-surface-tertiary text-text-primary text-xs leading-relaxed">
                    {streaming}
                    <span className="inline-block w-1 h-3 bg-pink-400 ml-0.5 animate-pulse" />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="border-t border-border-light p-3 flex gap-2">
              <input
                className="flex-1 border border-border rounded-full px-4 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-pink-300"
                placeholder="和小喂聊聊天..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-pink-400 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs
                           disabled:opacity-50 hover:bg-pink-500 transition-colors"
              >
                {loading ? '⋯' : '→'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
