"use client";

import { MessageCircle, Send, Trash2, AlertCircle, X } from "lucide-react";
import { Avatar } from "@/components/shared/avatar";
import { BottomSheet } from "@/components/shared/bottom-sheet";

type CommentsSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  commentList: any[];
  newComment: string;
  onNewCommentChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onDeleteComment: (id: string) => void;
  onReportComment: () => void;
  currentUserId?: string;
};

export function CommentsSheet({
  isOpen,
  onClose,
  commentList,
  newComment,
  onNewCommentChange,
  onSubmit,
  onDeleteComment,
  onReportComment,
  currentUserId,
}: CommentsSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} zIndex={30} className="h-[65%] p-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <span className="text-white text-[12px] font-bold tracking-wide">Comments ({commentList.length})</span>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-3 space-y-3 scrollbar-hide">
        {commentList.length > 0 ? (
          commentList.map((c) => (
            <div key={c.id} className="flex gap-2.5 items-start">
              <Avatar src={c.user?.image} name={c.user?.name} size={24} />
              <div className="flex flex-col flex-1 min-w-0 bg-white/[0.04] rounded-2xl px-3.5 py-2 border border-white/5">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="text-white text-[10px] font-bold">@{c.user?.name || "user"}</span>
                  <span className="text-white/40 text-[8px] font-medium flex items-center gap-1.5">
                    {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {c.userId === currentUserId ? (
                      <button onClick={() => onDeleteComment(c.id)} className="text-white/30 hover:text-red-400 transition" title="Delete">
                        <Trash2 size={10} />
                      </button>
                    ) : (
                      <button onClick={onReportComment} className="text-white/30 hover:text-red-400 transition" title="Report">
                        <AlertCircle size={10} />
                      </button>
                    )}
                  </span>
                </div>
                <p className="text-white/80 text-[11px] leading-relaxed break-words">{c.text}</p>
              </div>
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

      <form onSubmit={onSubmit} className="pt-2 border-t border-white/5 flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => onNewCommentChange(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 bg-white/[0.06] border border-white/10 rounded-full py-2.5 px-4 text-white text-[11px] outline-none placeholder:text-white/30 focus:border-[#e07c30]/50"
        />
        <button
          type="submit"
          disabled={!newComment.trim()}
          className="p-2 bg-[#e07c30] disabled:bg-neutral-800 disabled:text-white/30 text-black rounded-full transition-colors flex items-center justify-center h-8 w-8"
        >
          <Send size={11} strokeWidth={2.5} />
        </button>
      </form>
    </BottomSheet>
  );
}