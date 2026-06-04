"use client";

import { GroupSelector } from "./group-selector";
import type { MockGroup } from "@/components/shared/mock-data";

export function AppHeader({
  groups,
  activeIndex,
  onSelectIndex,
}: {
  groups: MockGroup[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
}) {
  if (groups.length <= 1) return null;

  return (
    <GroupSelector
      groups={groups}
      activeIndex={activeIndex}
      onSelectIndex={onSelectIndex}
    />
  );
}
