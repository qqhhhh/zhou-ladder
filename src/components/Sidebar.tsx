"use client";

import Image from "next/image";
import type { ReactNode } from "react";

const DOUYU = "https://www.douyu.com/88660";

const items: {
  id: string;
  label: string;
  href: string;
  external?: boolean;
  current?: boolean;
  icon: ReactNode;
}[] = [
  {
    id: "overview",
    label: "总览",
    href: "#overview",
    current: true,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z" strokeLinejoin="round" />
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
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "recent",
    label: "近期",
    href: "#recent",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M4 19V5M4 19h16M8 15v4M12 11v8M16 8v11" strokeLinecap="round" strokeLinejoin="round" />
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
      </svg>
    ),
  },
];

export function Sidebar() {
  return (
    <>
      <aside
        className="sidebar-rail fixed left-3 top-1/2 z-40 hidden w-[4.35rem] -translate-y-1/2 flex-col items-center rounded-[1.85rem] px-2.5 py-5 md:flex lg:left-5"
        aria-label="主导航"
      >
        <div className="avatar-ring mb-5 overflow-hidden rounded-full">
          <Image
            src="/zhou-avatar.jpg"
            alt="Zhou"
            width={40}
            height={40}
            className="h-10 w-10 object-cover"
            priority
          />
        </div>

        <nav className="flex flex-1 flex-col items-center gap-2.5">
          {items.map((item) => (
            <a
              key={item.id}
              href={item.href}
              {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
              title={item.label}
              aria-label={item.label}
              aria-current={item.current ? "true" : undefined}
              className="nav-icon flex h-10 w-10 items-center justify-center rounded-2xl"
            >
              {item.icon}
            </a>
          ))}
        </nav>

        <div className="mt-5 flex flex-col items-center gap-2.5 pt-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-white/50">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M21 12a9 9 0 11-3-6.7" strokeLinecap="round" />
              <path d="M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p
            className="max-w-[2.6rem] text-center text-[9px] leading-tight text-white/40"
            style={{ writingMode: "vertical-rl", letterSpacing: "0.1em" }}
          >
            刚刚更新
          </p>
        </div>
      </aside>

      <nav
        className="sidebar-rail fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl px-2 py-2.5 md:hidden"
        aria-label="移动导航"
      >
        {items.map((item) => (
          <a
            key={item.id}
            href={item.href}
            {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
            title={item.label}
            aria-label={item.label}
            aria-current={item.current ? "true" : undefined}
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
