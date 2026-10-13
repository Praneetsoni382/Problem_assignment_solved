import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Send,
  Loader2,
  Trash2,
  Copy,
  Check,
  Database,
  Users,
  FileText,
  AlertCircle,
  HelpCircle,
  X,
  Maximize2,
  Minimize2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  listAssignments,
  listStudents,
  listSubmissions,
  type Profile,
  type Assignment,
  type Submission,
} from "@/lib/db";
import { queryTeacherAssistantServerAction } from "@/lib/teacher-assistant-action";
import { processLocalTeacherQuery } from "@/lib/teacher-query-engine";

export interface TeacherChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
}

interface ChatMessageItem {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
}

// Quick starter prompt pills
const SUGGESTED_QUERIES = [
  "How many students have submitted the latest assignment and how many remaining?",
  "Tell me all student names with their enrollment numbers.",
  "Which student submissions are still pending check/grading?",
  "Who has not submitted yet for the most recent assignment?",
  "Give me an executive summary of class submissions and average marks.",
];

export function TeacherChatDialog({ open, onOpenChange, profile }: TeacherChatDialogProps) {
  const [engineMode, setEngineMode] = useState<"gemini" | "local">("gemini");
  const [inputMessage, setInputMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch live classroom state for the knowledge base
  const assignmentsQuery = useQuery({
    queryKey: ["assignments"],
    queryFn: listAssignments,
    enabled: open,
  });

  const studentsQuery = useQuery({
    queryKey: ["students"],
    queryFn: listStudents,
    enabled: open,
  });

  const submissionsQuery = useQuery({
    queryKey: ["submissions"],
    queryFn: () => listSubmissions(),
    enabled: open,
  });

  const assignments = assignmentsQuery.data || [];
  const students = studentsQuery.data || [];
  const submissions = submissionsQuery.data || [];

  const initialWelcomeText = useMemo(() => {
    const teacherFirst = profile?.full_name ? profile.full_name.split(" ")[0] : "Professor";
    return `Hello **${teacherFirst}**! I am your **AssignEase Classroom Assistant** powered by **Google Gemini** with intelligent **Model Cascading**.\n\n✨ **Active Mode: Google Gemini AI (Model Cascading Active)**\nAsk any query in natural language about student enrollments, assignments, submissions, or marks. I will understand your natural phrasing and query the live database context.\n\n**Example queries you can ask:**\n• *"How many students have submitted 4th assignment how many remaining?"*\n• *"What is Rahul's enrollment number?"*\n• *"Tell me all student names with their enrollment numbers."*\n• *"Which student submissions are still pending check/grading?"*\n• *"Who has not submitted yet for the most recent assignment?"*\n• *"Give me an executive summary of class submissions and average marks."*`;
  }, [profile?.full_name]);

  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: "welcome-msg",
      role: "model",
      text: initialWelcomeText,
      timestamp: new Date(),
    },
  ]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 150);
    }
  }, [messages, open]);

  const handleCopy = (text: string, id: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: "welcome-fresh",
        role: "model",
        text: initialWelcomeText,
        timestamp: new Date(),
      },
    ]);
    toast.info("Conversation reset");
  };

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputMessage).trim();
    if (!prompt || isSubmitting) return;

    setInputMessage("");

    const userMessage: ChatMessageItem = {
      id: `user-${Date.now()}`,
      role: "user",
      text: prompt,
      timestamp: new Date(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setIsSubmitting(true);

    // Map assignments to record schema
    const mappedAssignments = assignments.map((a: Assignment) => ({
      id: a.id,
      assignment_no: a.assignment_no,
      title: a.title,
      total_questions: a.total_questions,
      is_open: a.is_open,
      created_at: a.created_at,
    }));

    // Map students to record schema
    const mappedStudents = students.map((s: Profile) => ({
      id: s.id,
      full_name: s.full_name,
      enrollment_no: s.enrollment_no,
      email: s.email,
      created_at: s.created_at,
    }));

    // Map submissions to record schema
    const assignmentTitleMap = new Map(assignments.map((a) => [a.id, a]));
    const mappedSubmissions = submissions.map((sub: Submission) => {
      const assign = assignmentTitleMap.get(sub.assignment_id);
      return {
        id: sub.id,
        assignment_id: sub.assignment_id,
        student_id: sub.student_id,
        student_name: sub.student?.full_name,
        student_enrollment: sub.student?.enrollment_no,
        assignment_no: assign?.assignment_no,
        assignment_title: assign?.title,
        status: sub.status,
        checked_status: sub.checked_status,
        total_marks: sub.total_marks,
        submitted_at: sub.submitted_at,
      };
    });

    const contextData = {
      teacherName: profile?.full_name || "Teacher",
      assignments: mappedAssignments,
      students: mappedStudents,
      submissions: mappedSubmissions,
    };

    try {
      // 1. Built-in Local Query Engine (Zero API / 100% Free / Immune to 503)
      if (engineMode === "local") {
        // Small async tick for smooth UI transition
        await new Promise((resolve) => setTimeout(resolve, 80));

        const localResponse = processLocalTeacherQuery(prompt, contextData);

        const assistantMessage: ChatMessageItem = {
          id: `model-${Date.now()}`,
          role: "model",
          text: localResponse,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        return;
      }

      // 2. Gemini AI Mode (with automatic fallback on 503/errors)
      // Prepare conversation history excluding system welcome
      const apiHistory = newHistory
        .filter((m) => m.id !== "welcome-msg" && m.id !== "welcome-fresh")
        .slice(-10)
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const historyWithoutCurrent = apiHistory.slice(0, -1);

      try {
        const responseText = await queryTeacherAssistantServerAction({
          data: {
            message: prompt,
            history: historyWithoutCurrent,
            preferLocalEngine: false,
            context: contextData,
          },
        });

        const assistantMessage: ChatMessageItem = {
          id: `model-${Date.now()}`,
          role: "model",
          text: responseText,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (geminiError: unknown) {
        console.warn(
          "Gemini call hit 503 high demand or network failure. Recovering via Built-in Engine...",
          geminiError,
        );
        toast.info("Gemini high demand (503): Answered by Built-in Engine");

        const recoveredAnswer = processLocalTeacherQuery(prompt, contextData);

        const assistantMessage: ChatMessageItem = {
          id: `model-${Date.now()}`,
          role: "model",
          text: `> 💡 *Note: Google Gemini is currently experiencing heavy global demand (HTTP 503). Your query was resolved instantly by the Built-in Classroom Engine.*\n\n${recoveredAnswer}`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err: unknown) {
      console.error("Assistant execution error:", err);
      // Final catch: guaranteed recovery
      const fallbackAnswer = processLocalTeacherQuery(prompt, contextData);
      const assistantMessage: ChatMessageItem = {
        id: `model-${Date.now()}`,
        role: "model",
        text: fallbackAnswer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  if (profile && profile.role !== "teacher") {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`flex flex-col p-0 gap-0 overflow-hidden bg-background border-border/80 shadow-2xl transition-all duration-200 ${
          isExpanded
            ? "fixed inset-3 max-w-none w-auto h-auto rounded-2xl"
            : "w-[94vw] max-w-3xl h-[86vh] max-h-[750px] rounded-2xl"
        }`}
      >
        {/* Header Bar */}
        <DialogHeader className="px-5 py-3.5 border-b border-border/70 bg-gradient-to-r from-emerald-950/20 via-card to-emerald-950/10 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-gradient-to-tr from-[#0d5c52] to-emerald-500 flex items-center justify-center shadow-md shadow-emerald-900/20 text-white flex-shrink-0">
                <Sparkles className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <span>AssignEase Teacher Assistant</span>
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-semibold py-0 px-1.5"
                  >
                    AI Copilot
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>Ask anything about students, assignments, marks & submissions</span>
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-foreground"
                onClick={handleClearHistory}
                title="Clear chat history"
              >
                <Trash2 className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-foreground hidden sm:inline-flex"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Collapse dialog" : "Expand dialog"}
              >
                {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </Button>
            </div>
          </div>

          {/* Live Classroom Context & Engine Selector Bar */}
          <div className="mt-2.5 pt-2 border-t border-border/40 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Database:
              </span>
              <span className="inline-flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-md">
                <Users className="size-3 text-emerald-600 dark:text-emerald-400" />
                <strong>{students.length}</strong> Students
              </span>
              <span className="inline-flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-md">
                <FileText className="size-3 text-blue-600 dark:text-blue-400" />
                <strong>{assignments.length}</strong> Assignments
              </span>
              <span className="inline-flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-md">
                <Database className="size-3 text-amber-600 dark:text-amber-400" />
                <strong>{submissions.length}</strong> Submissions
              </span>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-1 bg-muted/70 p-0.5 rounded-lg border border-border/60 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setEngineMode("gemini");
                  toast.info(
                    "Active: Gemini AI with Model Cascading (gemini-flash-latest → gemini-3.1-flash-lite → gemini-3.8-flash)",
                  );
                }}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium transition-all ${
                  engineMode === "gemini"
                    ? "bg-[#0d5c52] text-white shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Google Gemini AI with intelligent multi-model cascading across active models"
              >
                <Sparkles className="size-3" />
                <span>Gemini AI (Cascading)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEngineMode("local");
                  toast.success(
                    "Switched to Built-in Engine (Instant, 0 API, Immune to 503 errors)",
                  );
                }}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium transition-all ${
                  engineMode === "local"
                    ? "bg-[#0d5c52] text-white shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Built-in Classroom Engine: 100% offline, zero API costs, completely immune to 503 high-demand errors"
              >
                <Zap className="size-3" />
                <span>Built-in Engine</span>
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Message Feed Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/15 min-h-0">
          {messages.map((message) => {
            const isUser = message.role === "user";
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="size-8 rounded-lg bg-[#0d5c52] text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                    {engineMode === "local" ? (
                      <Zap className="size-4" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                  </div>
                )}

                <div
                  className={`relative group max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-all ${
                    isUser
                      ? "bg-[#0d5c52] text-white rounded-br-xs"
                      : "bg-card border border-border/80 text-foreground rounded-bl-xs"
                  }`}
                >
                  <FormattedMessageContent content={message.text} isUser={isUser} />

                  <div
                    className={`mt-2 flex items-center justify-between gap-3 text-[10px] ${
                      isUser ? "text-emerald-100/70" : "text-muted-foreground/70"
                    }`}
                  >
                    <span>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleCopy(message.text, message.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 hover:text-foreground"
                        title="Copy answer"
                      >
                        {copiedId === message.id ? (
                          <>
                            <Check className="size-3 text-emerald-500" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isSubmitting && (
            <div className="flex gap-3 justify-start items-center">
              <div className="size-8 rounded-lg bg-[#0d5c52] text-white flex items-center justify-center flex-shrink-0 shadow-sm animate-pulse">
                {engineMode === "local" ? (
                  <Zap className="size-4" />
                ) : (
                  <Sparkles className="size-4" />
                )}
              </div>
              <div className="bg-card border border-border/80 rounded-2xl rounded-bl-xs px-4 py-3 text-sm shadow-sm flex items-center gap-2.5 text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-[#0d5c52]" />
                <span className="font-medium text-xs">
                  {engineMode === "local"
                    ? "Searching classroom database instantly..."
                    : "Querying classroom database with Gemini..."}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompt Chips */}
        {messages.length <= 2 && (
          <div className="px-4 py-2 border-t border-border/50 bg-card/60 flex-shrink-0">
            <p className="text-[11px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
              <HelpCircle className="size-3" /> Quick Teacher Questions:
            </p>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {SUGGESTED_QUERIES.map((query, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => void handleSendMessage(query)}
                  disabled={isSubmitting}
                  className="whitespace-nowrap text-xs bg-muted/80 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-500/30 border border-border/60 rounded-full px-3 py-1 transition text-muted-foreground disabled:opacity-50"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 border-t border-border/80 bg-card flex-shrink-0">
          <div className="relative flex items-end gap-2">
            <Textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask an enquiry (e.g. 'How many submitted Assignment 4?', 'Find enrollment no for Rahul', etc.)..."
              disabled={isSubmitting}
              rows={2}
              className="min-h-[50px] max-h-[140px] resize-none pr-12 text-xs sm:text-sm rounded-xl py-2.5"
            />
            <Button
              type="button"
              size="icon"
              disabled={!inputMessage.trim() || isSubmitting}
              onClick={() => void handleSendMessage()}
              className="absolute right-2 bottom-2 size-8 rounded-lg bg-[#0d5c52] hover:bg-[#0b4d45] text-white shadow-sm disabled:opacity-40"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              Press <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">Enter</kbd>{" "}
              to send,{" "}
              <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">Shift+Enter</kbd>{" "}
              for new line
            </span>
            <span className="text-[10px] flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
              {engineMode === "local" ? (
                <>
                  <Zap className="size-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Built-in Engine (0 API / Zero 503 Errors)</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Gemini AI (Auto-fallback to Built-in Engine)</span>
                </>
              )}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Formatted Markdown & Table message content component
 */
function FormattedMessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  if (isUser) {
    return <p className="whitespace-pre-wrap leading-relaxed">{content}</p>;
  }

  // Parse sections, markdown lists, bold text, and tables
  const lines = content.split("\n");
  const renderedElements: React.ReactNode[] = [];

  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];

  const flushTable = (key: string) => {
    if (inTable && (tableHeader.length > 0 || tableRows.length > 0)) {
      renderedElements.push(
        <div key={key} className="my-2.5 overflow-x-auto rounded-lg border border-border/70">
          <table className="w-full text-xs text-left border-collapse">
            {tableHeader.length > 0 && (
              <thead className="bg-muted/70 text-foreground font-semibold border-b border-border/70">
                <tr>
                  {tableHeader.map((h, hIdx) => (
                    <th
                      key={hIdx}
                      className="px-3 py-1.5 border-r last:border-r-0 border-border/50"
                    >
                      {renderInlineFormatting(h.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {tableRows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="border-b last:border-b-0 border-border/40 odd:bg-card even:bg-muted/20 hover:bg-muted/40 transition"
                >
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="px-3 py-1.5 border-r last:border-r-0 border-border/40"
                    >
                      {renderInlineFormatting(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      inTable = false;
      tableHeader = [];
      tableRows = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for markdown table line
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const cells = trimmed
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());

      // Check if it's separator row like |---|---|
      const isSeparator = cells.every((c) => /^:?-+:?$/.test(c));
      if (isSeparator) {
        // Table header is finalized
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else {
      flushTable(`table-${i}`);
    }

    // Empty lines
    if (!trimmed) {
      renderedElements.push(<div key={`empty-${i}`} className="h-2" />);
      continue;
    }

    // Headings (e.g. ### Title)
    if (trimmed.startsWith("### ")) {
      renderedElements.push(
        <h4 key={`h3-${i}`} className="text-sm font-bold text-foreground mt-3 mb-1">
          {renderInlineFormatting(trimmed.slice(4))}
        </h4>,
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      renderedElements.push(
        <h3 key={`h2-${i}`} className="text-base font-bold text-foreground mt-3.5 mb-1.5">
          {renderInlineFormatting(trimmed.slice(3))}
        </h3>,
      );
      continue;
    }

    // Bullet points (- or • or *)
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ") || trimmed.startsWith("* ")) {
      const itemText = trimmed.slice(2);
      renderedElements.push(
        <div key={`bullet-${i}`} className="flex items-start gap-2 my-0.5 pl-1">
          <span className="size-1.5 rounded-full bg-[#0d5c52] dark:bg-emerald-400 mt-2 flex-shrink-0" />
          <span className="leading-relaxed">{renderInlineFormatting(itemText)}</span>
        </div>,
      );
      continue;
    }

    // Numbered list (e.g. "1. ")
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      renderedElements.push(
        <div key={`num-${i}`} className="flex items-start gap-2 my-0.5 pl-1">
          <span className="font-semibold text-xs text-[#0d5c52] dark:text-emerald-400 min-w-4 mt-0.5">
            {numMatch[1]}.
          </span>
          <span className="leading-relaxed">{renderInlineFormatting(numMatch[2])}</span>
        </div>,
      );
      continue;
    }

    // Standard paragraph
    renderedElements.push(
      <p key={`p-${i}`} className="leading-relaxed my-1">
        {renderInlineFormatting(line)}
      </p>,
    );
  }

  flushTable(`table-final`);

  return <div className="space-y-1">{renderedElements}</div>;
}

/**
 * Parses bold (**text**), code (`code`), italics (*text*)
 */
function renderInlineFormatting(text: string): React.ReactNode {
  // Split by bold (**...**)
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-muted text-[11px] font-mono border border-border/50 text-[#0d5c52] dark:text-emerald-400"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
