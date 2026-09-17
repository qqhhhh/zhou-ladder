"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const DOUYU = "https://www.douyu.com/88660";

const items: {
  id: string;
  label: string;
  href: string;
  external?: boolean;
  icon: ReactNode;
}[] = [
  {
    id: "overview",
    label: "总览",
    href: "#overview",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    id: "trend",
    label: "走势",
    href: "#trend",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 7h7v7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "heroes",
    label: "英雄",
    href: "#heroes",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 3l2.2 4.5L19 8.3l-3.5 3.4.8 4.8L12 14.8 7.7 16.5l.8-4.8L5 8.3l4.8-.8L12 3z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "live",
    label: "直播间",
    href: DOUYU,
    external: true,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M5 5h14a2 2 0 012 2v8a2 2 0 01-2 2H9l-4 3v-3H5a2 2 0 01-2-2V7a2 2 0 012-2z" strokeLinejoin="round" />
        <circle cx="9" cy="11" r="1" fill="currentColor" stroke="none" />
        <circle cx="15" cy="11" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

export function Sidebar() {
  return (
    <>
      {/* Desktop rail */}
      <motion.aside
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="sidebar-rail fixed left-3 top-1/2 z-40 hidden w-14 -translate-y-1/2 flex-col items-center gap-2 rounded-2xl px-2 py-4 md:flex lg:left-4"
        aria-label="主导航"
      >
        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-teal-400/10 text-xs font-bold text-teal-200 ring-1 ring-teal-400/30">
          Z
        </div>
        <nav className="flex flex-col items-center gap-1.5">
          {items.map((item) => (
            <a
              key={item.id}
              href={item.href}
              {...(item.external
                ? { target: "_blank", rel: "noreferrer" }
                : {})}
              title={item.label}
              aria-label={item.label}
              className="nav-icon flex h-10 w-10 items-center justify-center rounded-xl"
            >
              {item.icon}
            </a>
          ))}
        </nav>
      </motion.aside>

      {/* Mobile bottom icon bar */}
      <nav
        className="sidebar-rail fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl px-2 py-2 md:hidden"
        aria-label="移动导航"
      >
        {items.map((item) => (
          <a
            key={item.id}
            href={item.href}
            {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
            title={item.label}
            aria-label={item.label}
            className="nav-icon flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px]"
          >
            {item.icon}
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </>
  );
}
