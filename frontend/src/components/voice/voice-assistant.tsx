import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, Mic, MicOff, X, Volume2, Loader2, Check, XCircle, ExternalLink } from 'lucide-react';
import { useVoiceStore } from '@/store/voice-store';
import { useSendCommand, useConfirmAction } from '@/hooks/use-voice-assistant';
import { useSpeech } from '@/hooks/use-speech';
import type { ChatMessage } from '@/types/voice';
import { cn } from '@/lib/utils';

export function VoiceAssistant() {
  const navigate = useNavigate();
  const { isOpen, setOpen, messages, addMessage, updateMessage } = useVoiceStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sendCommand = useSendCommand();
  const confirmAction = useConfirmAction();
  const { isListening, transcript, isSpeaking, isSupported, startListening, stopListening, speak } = useSpeech();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (!isListening && transcript) {
      handleSend(transcript);
      setInput('');
    }
  }, [isListening]);

  const handleNavigate = useCallback(
    (path: string) => {
      setOpen(false);
      setTimeout(() => navigate(path), 300);
    },
    [navigate, setOpen]
  );

  const handleSend = useCallback(
    (text?: string) => {
      const msg = (text || input).trim();
      if (!msg) return;

      const userMsgId = crypto.randomUUID();
      const assistantMsgId = crypto.randomUUID();

      addMessage({ id: userMsgId, role: 'user', content: msg });
      addMessage({ id: assistantMsgId, role: 'assistant', content: '', isLoading: true });
      setInput('');

      sendCommand.mutate(
        { text: msg },
        {
          onSuccess: (data) => {
            updateMessage(assistantMsgId, {
              content: data.message,
              intent: data.intent,
              requiresConfirmation: data.requiresConfirmation,
              pendingActionId: data.pendingActionId,
              navigateTo: data.navigateTo,
              isLoading: false,
            });
            if (data.message) {
              speak(data.message);
            }
            // Auto-navigate for read intents
            if (data.navigateTo && !data.requiresConfirmation) {
              setTimeout(() => handleNavigate(data.navigateTo!), 1200);
            }
          },
          onError: (error: unknown) => {
            const errMsg = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
            updateMessage(assistantMsgId, {
              content: errMsg,
              isLoading: false,
            });
          },
        }
      );
    },
    [input, addMessage, updateMessage, sendCommand, speak, handleNavigate]
  );

  const handleConfirm = useCallback(
    (pendingActionId: string, messageId: string, confirmed: boolean) => {
      updateMessage(messageId, { confirmed });

      const responseMsgId = crypto.randomUUID();
      addMessage({ id: responseMsgId, role: 'assistant', content: '', isLoading: true });

      confirmAction.mutate(
        { pendingActionId, confirmed },
        {
          onSuccess: (data) => {
            updateMessage(responseMsgId, {
              content: data.message,
              intent: data.intent,
              navigateTo: data.navigateTo,
              isLoading: false,
            });
            if (data.message) {
              speak(data.message);
            }
            // Navigate after confirmed write action
            if (data.navigateTo && confirmed) {
              setTimeout(() => handleNavigate(data.navigateTo!), 1500);
            }
          },
          onError: () => {
            updateMessage(responseMsgId, {
              content: 'Failed to process confirmation.',
              isLoading: false,
            });
          },
        }
      );
    },
    [addMessage, updateMessage, confirmAction, speak, handleNavigate]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'fixed z-50 flex items-center justify-center rounded-full shadow-lg transition-all duration-300',
          'bg-primary text-primary-foreground hover:bg-primary/90',
          'h-14 w-14 bottom-24 right-4 md:bottom-6 md:right-6',
          isOpen && 'scale-0 opacity-0'
        )}
      >
        <Bot className="h-6 w-6" />
      </button>

      {/* Chat Panel */}
      <Sheet open={isOpen} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:w-[420px] p-0 flex flex-col [&>button]:hidden"
        >
          {/* Header */}
          <SheetHeader className="px-4 py-3 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <SheetTitle className="text-base">FinTrack Assistant</SheetTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-12">
                <Bot className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm font-medium">Hi! I'm your financial assistant.</p>
                <p className="text-xs mt-1 max-w-[260px]">
                  Try saying "How much money do I have?" or "Add expense of $25 for coffee"
                </p>
              </div>
            )}

            <div className="space-y-3">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onConfirm={handleConfirm}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="border-t px-4 py-3 flex-shrink-0">
            {isSpeaking && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Volume2 className="h-3 w-3 animate-pulse" />
                <span>Speaking...</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              {isSupported && (
                <Button
                  variant={isListening ? 'destructive' : 'outline'}
                  size="icon"
                  onClick={toggleMic}
                  className="shrink-0"
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
              <Input
                ref={inputRef}
                placeholder={isListening ? 'Listening...' : 'Type a command...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isListening}
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={() => handleSend()}
                disabled={!input.trim() || sendCommand.isPending}
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function MessageBubble({
  message,
  onConfirm,
  onNavigate,
}: {
  message: ChatMessage;
  onConfirm: (pendingActionId: string, messageId: string, confirmed: boolean) => void;
  onNavigate: (path: string) => void;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted rounded-bl-md'
        )}
      >
        {message.isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-muted-foreground">Thinking...</span>
          </div>
        ) : (
          <>
            <p className="whitespace-pre-wrap">{message.content}</p>

            {message.navigateTo && !message.requiresConfirmation && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs gap-1 mt-1.5 -ml-1 text-primary hover:text-primary"
                onClick={() => onNavigate(message.navigateTo!)}
              >
                <ExternalLink className="h-3 w-3" />
                Open page
              </Button>
            )}

            {message.requiresConfirmation && message.pendingActionId && message.confirmed === undefined && (
              <div className="flex gap-2 mt-2.5">
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 text-xs gap-1"
                  onClick={() => onConfirm(message.pendingActionId!, message.id, true)}
                >
                  <Check className="h-3 w-3" />
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={() => onConfirm(message.pendingActionId!, message.id, false)}
                >
                  <XCircle className="h-3 w-3" />
                  Cancel
                </Button>
              </div>
            )}

            {message.confirmed === true && (
              <p className="text-xs mt-1 opacity-70">Confirmed</p>
            )}
            {message.confirmed === false && (
              <p className="text-xs mt-1 opacity-70">Cancelled</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
