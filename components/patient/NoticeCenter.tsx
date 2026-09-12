"use client";

import { useEffect, useState } from "react";
import { acknowledgeNotice, listPatientNotices, type ClinicNotice } from "@/lib/data/notices";

export function NoticeCenter({ email }: { email: string }) {
  const [notices, setNotices] = useState<ClinicNotice[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void listPatientNotices(email).then(setNotices);
  }, [email]);

  const unreadCount = notices.filter((notice) => !notice.acknowledged).length;
  const visibleNotices = notices.filter((notice) => !notice.acknowledged || notice.requiresAck);

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} className="min-h-11 rounded-[6px] border border-marigold-600 bg-marigold-100 px-4 py-2 font-semibold text-ink-900" aria-expanded={open}>
        Notices {unreadCount > 0 ? <span className="ml-2 rounded-full bg-marigold-600 px-2 py-0.5 text-xs text-white">{unreadCount}</span> : null}
      </button>
      {open ? <div className="absolute right-0 z-30 mt-2 w-[min(92vw,380px)] rounded-[12px] border border-border bg-surface p-4 shadow-[0_10px_30px_rgba(11,46,43,0.16)]">
        <div className="flex items-center justify-between"><h2 className="font-serif text-xl font-semibold text-ink-900">Clinic notices</h2><span className="text-xs text-ink-500">Talk to a person</span></div>
        <div className="mt-3 space-y-3">
          {visibleNotices.length === 0 ? <p className="rounded-[6px] bg-surface-warm p-3 text-sm text-ink-700">You have no current notices.</p> : visibleNotices.map((notice) => <article key={notice.id} className="rounded-[6px] border border-marigold-600 bg-marigold-100 p-3"><p className="font-semibold text-ink-900">{notice.title}</p><p className="mt-1 text-sm text-ink-700">{notice.text}</p>{notice.requiresAck && !notice.acknowledged ? <button type="button" onClick={() => void acknowledgeNotice(notice).then((updated) => setNotices((items) => items.map((item) => item.id === updated.id ? updated : item)))} className="mt-3 min-h-11 rounded-[6px] bg-care-700 px-3 py-2 text-sm font-semibold text-white">Acknowledge</button> : null}</article>)}
        </div>
      </div> : null}
    </div>
  );
}
