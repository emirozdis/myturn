"use client";

import { useState, useRef } from "react";
import { MessageCircle, Send, Trash2, X, CornerDownRight, AtSign } from "lucide-react";
import { Avatar } from "@/components/shared/avatar";
import { BottomSheet } from "@/components/shared/bottom-sheet";
import { motion, AnimatePresence } from "framer-motion";

type CommentsSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  groupMembers: any[];
  commentList: any[];
  newComment: string;
  onNewCommentChange: (value: string) => void;
  onSubmit: (e: React.FormEvent, parentId?: string) => void;
  onDeleteComment: (id: string) => void;
  currentUserId?: string;
};

export function CommentsSheet({
  isOpen,
  onClose,
  groupMembers = [],
  commentList,
  newComment,
  onNewCommentChange,
  onSubmit,
  onDeleteComment,
  currentUserId,
}: CommentsSheetProps) {
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Derive contextual threaded grouping mapping out isolated child paths correctly
  const topLevel = commentList.filter((c) => !c.parentId);
  const repliesMap = commentList.reduce((acc, c) => {
    if (c.parentId) {
      if (!acc[c.parentId]) acc[c.parentId] = [];
      acc[c.parentId].push(c);
    }
    return acc;
  }, {} as Record<string, any[]>);

  // Unified scroll sync using requestAnimationFrame to prevent visual lag
  const syncScroll = () => {
    requestAnimationFrame(() => {
      if (inputRef.current && overlayRef.current) {
        overlayRef.current.scrollLeft = inputRef.current.scrollLeft;
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onNewCommentChange(val);
    const cursor = e.target.selectionStart || 0;
    setCursorPos(cursor);
    
    // Evaluate if the pointer boundaries match active generic @mentions requests dynamically
    const beforeCursor = val.slice(0, cursor);
    const match = beforeCursor.match(/@([a-zA-Z0-9_]*)$/);
    if (match) {
      setMentionQuery(match[1]);
    } else {
      setMentionQuery(null);
    }

    syncScroll();
  };

  // Keep cursor position and mention state in sync when moving around via keyboard/mouse click
  const handleInputSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const target = e.currentTarget;
    const cursor = target.selectionStart || 0;
    setCursorPos(cursor);
    
    const beforeCursor = target.value.slice(0, cursor);
    const match = beforeCursor.match(/@([a-zA-Z0-9_]*)$/);
    if (match) {
      setMentionQuery(match[1]);
    } else {
      setMentionQuery(null);
    }

    syncScroll();
  };

  const handleScroll = () => {
    syncScroll();
  };

  const insertMention = (handle: string) => {
    const before = newComment.slice(0, cursorPos).replace(/@[a-zA-Z0-9_]*$/, `@${handle} `);
    const after = newComment.slice(cursorPos);
    onNewCommentChange(before + after);
    setMentionQuery(null);
    inputRef.current?.focus();
    
    // Flush updates to DOM and force-sync the visual overflow offsets
    requestAnimationFrame(() => {
      if (inputRef.current && overlayRef.current) {
        overlayRef.current.scrollLeft = inputRef.current.scrollLeft;
      }
    });
  };

  const filteredMembers = mentionQuery !== null 
    ? (groupMembers || []).filter((m: any) => 
        m.handle?.toLowerCase().includes(mentionQuery.toLowerCase()) || 
        m.name?.toLowerCase().includes(mentionQuery.toLowerCase())
      )
    : [];

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e, replyToId || undefined);
    setReplyToId(null);
  };

  const renderCommentText = (text: string) => {
    if (!text) return "";
    const parts = text.split(/(\s+)/);
    
    return parts.map((part, idx) => {
      if (part.startsWith("@") && part.length > 1) {
        const cleanHandle = part.substring(1).replace(/[^a-zA-Z0-9_]/g, "");
        const matchedMember = (groupMembers || []).find(
          (m: any) => m.handle?.toLowerCase() === cleanHandle.toLowerCase()
        );

        return (
          <span 
            key={idx}
            className="inline-flex items-center gap-1.5 bg-[#e07c30]/15 border border-[#e07c30]/35 px-1.5 py-0.5 rounded-md text-[#e07c30] font-bold text-[11px] align-baseline mx-0.5 select-none"
          >
            <Avatar src={matchedMember?.image} name={matchedMember?.name} size={14} />
            <span>{part}</span>
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  // High-fidelity overlay ensuring exact character alignment & visual representation inside input
  const renderInputHighlight = () => {
    if (!newComment) return null;
    const parts = newComment.split(/(\s+)/);

    return (
      <div 
        ref={overlayRef}
        className="absolute inset-y-0 left-0 right-0 h-10 py-2.5 px-4 text-[12px] font-sans font-normal leading-normal pointer-events-none overflow-x-auto scrollbar-hide whitespace-pre bg-transparent border border-transparent text-white"
      >
        {parts.map((part, idx) => {
          if (part.startsWith("@") && part.length > 1) {
            const cleanHandle = part.substring(1).replace(/[^a-zA-Z0-9_]/g, "");
            const isMatch = (groupMembers || []).some(
              (m: any) => m.handle?.toLowerCase() === cleanHandle.toLowerCase()
            );

            if (isMatch) {
              return (
                <span 
                  key={idx}
                  className="text-[#e07c30] bg-[#e07c30]/15 rounded-[4px] px-0.5 -mx-0.5"
                >
                  {part}
                </span>
              );
            }
          }
          return <span key={idx}>{part}</span>;
        })}
      </div>
    );
  };

  const renderComment = (c: any, isReply: boolean = false) => (
    <div key={c.id} className={`flex gap-2.5 items-start ${isReply ? "ml-[34px] mt-2 relative" : ""}`}>
      {isReply && (
        <div className="absolute -left-5 top-0 bottom-1/2 w-4 border-l-2 border-b-2 border-white/10 rounded-bl-lg" />
      )}
      <Avatar src={c.user?.image} name={c.user?.name} size={isReply ? 20 : 28} />
      <div className="flex flex-col flex-1 min-w-0 bg-white/[0.04] rounded-2xl px-3.5 py-2.5 border border-white/5">
        <div className="flex justify-between items-baseline mb-0.5">
          <span className="text-white text-[11px] font-bold">@{c.user?.handle || c.user?.name || "user"}</span>
          <span className="text-white/40 text-[8px] font-medium flex items-center gap-1.5">
            {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            {c.userId === currentUserId && (
              <button onClick={() => onDeleteComment(c.id)} className="text-white/30 hover:text-red-400 transition ml-1" title="Delete">
                <Trash2 size={10} />
              </button>
            )}
          </span>
        </div>
        <div className="text-white/80 text-[12px] leading-relaxed break-words">{renderCommentText(c.text)}</div>
        
        {!isReply && (
          <button 
            onClick={() => { setReplyToId(c.id); inputRef.current?.focus(); }} 
            className="text-white/30 text-[10px] font-semibold hover:text-white mt-1.5 text-left w-max transition-colors flex items-center gap-1"
          >
            <CornerDownRight size={10} />
            Reply
          </button>
        )}
      </div>
    </div>
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} zIndex={30} className="h-[65%] p-4 flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-white/5 flex-shrink-0">
        <span className="text-white text-[12px] font-bold tracking-wide">Comments ({commentList.length})</span>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-3 space-y-3.5 scrollbar-hide relative">
        {commentList.length > 0 ? (
          topLevel.map((c: any) => (
            <div key={c.id} className="flex flex-col">
              {renderComment(c, false)}
              {repliesMap[c.id]?.map((r: any) => renderComment(r, true))}
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <MessageCircle size={24} className="text-white/20 mb-1.5" />
            <span className="text-white/40 text-[11px] font-semibold">No comments yet.</span>
            <span className="text-white/25 text-[9px] mt-0.5">Be the first to react to today&apos;s turn!</span>
          </div>
        )}
      </div>

      <div className="relative pt-2 flex flex-col flex-shrink-0">
        <AnimatePresence>
          {mentionQuery !== null && filteredMembers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute bottom-full left-0 right-0 mb-3.5 z-50"
            >
              {/* Arrow Pointer */}
              <div className="absolute -bottom-[5px] left-8 w-3.5 h-3.5 bg-[#161618] border-b border-r border-white/10 rotate-45 z-0" />
              
              {/* Dropdown Box */}
              <div className="relative bg-[#161618]/95 backdrop-blur-3xl border border-white/10 rounded-[20px] shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col max-h-[180px] z-10 overflow-hidden">
                
                {/* Fixed Header */}
                <div className="px-4 py-2.5 flex items-center gap-1.5 bg-white/[0.02] border-b border-white/5 flex-shrink-0 z-20">
                  <AtSign size={11} className="text-white/40" />
                  <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Mention User</span>
                </div>

                {/* Scrollable List Area */}
                <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-0.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-track]:my-1.5 [&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-[&::-webkit-scrollbar-thumb]:bg-white/30 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {filteredMembers.map((m: any) => (
                    <div 
                      key={m.id} 
                      onClick={() => insertMention(m.handle)}
                      className="flex items-center gap-3.5 p-2 px-3 rounded-[14px] hover:bg-white/[0.08] cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <Avatar src={m.image} name={m.name} size={30} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-white text-[13px] font-bold leading-none mb-1 truncate">{m.name}</span>
                        <span className="text-[#e07c30] text-[11px] font-semibold leading-none truncate">@{m.handle}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {replyToId && (
          <div className="flex items-center justify-between bg-white/5 px-3 py-1.5 rounded-t-xl text-[10px] text-white/50 border border-white/10 border-b-0">
            <span className="font-semibold text-white/60">
              Replying to @{commentList.find(c => c.id === replyToId)?.user?.handle || "User"}
            </span>
            <button type="button" onClick={() => setReplyToId(null)} className="hover:text-white transition-colors">
              <X size={12}/>
            </button>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <div className="relative flex-1 flex items-center min-w-0">
            {/* Custom Masking Visual Overlay - positioned behind the transparent input */}
            {newComment && renderInputHighlight()}

            {/* Native text-input element masked with transparency */}
            <input
              ref={inputRef}
              type="text"
              value={newComment}
              onChange={handleInputChange}
              onSelect={handleInputSelect}
              onScroll={handleScroll}
              placeholder={replyToId ? "Write a reply..." : "Add a comment..."}
              className={`w-full bg-white/[0.06] border border-white/10 h-10 py-2.5 px-4 text-transparent caret-white text-[12px] font-sans leading-normal outline-none placeholder:text-white/30 focus:border-[#e07c30]/50 select-text relative z-10 ${
                replyToId ? "rounded-b-xl rounded-tr-xl" : "rounded-full"
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={!newComment.trim()}
            className={`p-2 bg-[#e07c30] disabled:bg-neutral-800 disabled:text-white/30 text-black transition-colors flex items-center justify-center h-10 w-10 flex-shrink-0 relative z-10 ${replyToId ? "rounded-xl" : "rounded-full"}`}
          >
            <Send size={14} strokeWidth={2.5} className="mr-0.5" />
          </button>
        </form>
      </div>
    </BottomSheet>
  );
}