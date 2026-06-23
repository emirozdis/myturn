"use client";

import { Loader2, Plus, Copy, Check, Info, LogOut } from "lucide-react";
import { glassStyle } from "@/components/shared/glass-style";
import { ACCENT } from "@/lib/theme";
import { Avatar } from "@/components/shared/avatar";
import { BottomSheet } from "@/components/shared/bottom-sheet";
import { UserProfileSheetContent } from "@/components/profile/user-profile-sheet-content";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export interface GroupSheetContentProps {
  activeSheet: "views" | "comments" | "group-info" | "user-profile" | null;
  sheetData: any;
  commentsList: any[];
  commentInput: string;
  commentError: string;
  submittingComment: boolean;
  copySuccess: boolean;
  onCommentInputChange: (value: string) => void;
  onSubmitComment: () => void;
  onCopyInviteCode: (code: string) => void;
  onLeaveGroup: () => void;
  onCloseSheet: () => void;
}

export function GroupSheetContent({
  activeSheet,
  sheetData,
  commentsList,
  commentInput,
  commentError,
  submittingComment,
  copySuccess,
  onCommentInputChange,
  onSubmitComment,
  onCopyInviteCode,
  onLeaveGroup,
  onCloseSheet,
}: GroupSheetContentProps) {
  const { t } = useTranslation();

  return (
    <BottomSheet
      isOpen={activeSheet !== null}
      onClose={onCloseSheet}
      zIndex={40}
      className="p-6 max-h-[80%]"
    >
      <div className="flex-1 overflow-y-auto pr-0.5 scrollbar-hide flex flex-col gap-4">
        {activeSheet === "views" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2 flex-shrink-0">
              <Info size={16} className="text-[#e07c30]" />
              <h3 className="text-white text-base font-bold">
                {t("sheets.seenBy", { count: sheetData?.views?.length || 0 })}
              </h3>
            </div>
            {sheetData?.views && sheetData.views.length > 0 ? (
              <div className="flex flex-col gap-2">
                {sheetData.views.map((view: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5"
                  >
                    <Avatar src={view.user?.image} name={view.user?.name} size={40} />
                    <span className="text-white text-sm font-bold">
                      {view.user?.name || "Group Friend"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/40 text-xs">{t("sheets.noViews")}</p>
            )}
          </div>
        )}

        {activeSheet === "comments" && (
          <div className="flex-1 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3">
              <h3 className="text-white text-base font-bold flex-shrink-0">
                {t("sheets.comments", { count: commentsList.length })}
              </h3>
              <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
                {commentsList.map((comm: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5"
                  >
                    <Avatar src={comm.user?.image} name={comm.user?.name} size={32} />
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-white text-xs font-bold">
                        {comm.user?.name || "Friend"}
                      </span>
                      <span className="text-white/70 text-[11px] font-medium truncate w-full mt-0.5">
                        {comm.text}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-2 flex-shrink-0">
              {commentError && (
                <p className="text-red-500 text-[10px] font-semibold">{commentError}</p>
              )}
              <div className="relative flex items-center">
                <input
                  type="text"
                  maxLength={30}
                  value={commentInput}
                  onChange={(e) => onCommentInputChange(e.target.value)}
                  placeholder={t("sheets.commentPlaceholder")}
                  className="w-full rounded-full py-3.5 pl-4 pr-12 text-white text-xs outline-none bg-white/5 border border-white/10 focus:border-[#e07c30]/50 placeholder:text-white/30"
                />
                <button
                  onClick={onSubmitComment}
                  disabled={submittingComment || !commentInput.trim()}
                  style={{ background: ACCENT }}
                  className="absolute right-1.5 w-8 h-8 rounded-full flex items-center justify-center text-black font-bold disabled:opacity-50"
                >
                  {submittingComment ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSheet === "group-info" && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h3 className="text-white text-lg font-bold">{sheetData?.groupName}</h3>
              <span className="text-white/45 text-xs font-medium">
                {t("sheets.groupDetails")}
              </span>
            </div>

            <div
              style={glassStyle(0.04, 16, 0.08)}
              className="rounded-2xl p-4 flex justify-between items-center"
            >
              <div className="flex flex-col">
                <span className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1">
                  {t("sheets.inviteCode")}
                </span>
                <span className="text-white font-mono text-xl font-extrabold tracking-widest">
                  {sheetData?.inviteCode}
                </span>
              </div>
              <button
                onClick={() => onCopyInviteCode(sheetData?.inviteCode)}
                style={{ background: copySuccess ? "#22c55e" : ACCENT }}
                className="px-4 py-2 rounded-xl text-black text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                {copySuccess ? <Check size={12} strokeWidth={3} /> : <Copy size={12} />}
                {t("sheets.copyCode")}
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">
                {t("sheets.groupDirectory", { count: sheetData?.members?.length || 0 })}
              </h4>
              <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto">
                {sheetData?.members?.map((member: any) => (
                  <div
                    key={member.user.id}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5"
                  >
                    <Avatar
                      src={member.user.image}
                      name={member.user.name}
                      size={40}
                    />
                    <div className="flex flex-col">
                      <span className="text-white text-sm font-bold">
                        {member.user.name}
                      </span>
                      <span className="text-white/45 text-xs">
                        @{member.user.handle}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onLeaveGroup}
              style={glassStyle(0.04, 24, 0.08)}
              className="w-full mt-4 py-3.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition hover:bg-red-500/20 active:scale-95"
            >
              <LogOut size={16} />
              {t("sheets.leaveGroup")}
            </button>
          </div>
        )}

        {activeSheet === "user-profile" && (
          <UserProfileSheetContent userId={sheetData?.userId} />
        )}
      </div>
    </BottomSheet>
  );
}
