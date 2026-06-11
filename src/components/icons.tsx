/* Minimal 24px line-icon set (stroke = currentColor) so glyphs always contrast
 * with the background. Default stroke 1.8, rounded caps — mockup style. */

import type { SVGProps } from "react";

function base(props: SVGProps<SVGSVGElement>) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    width: props.width ?? 22,
    height: props.height ?? 22,
    "aria-hidden": true,
    ...props,
  };
}

export const IconMenu = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 7h16M4 12h10M4 17h16" /></svg>
);
export const IconBell = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M18 9.5a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
    <path d="M10.3 19a2 2 0 0 0 3.4 0" />
  </svg>
);
export const IconClose = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const IconHome = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 11l8-7 8 7" />
    <path d="M6 9.5V20h12V9.5" />
  </svg>
);
export const IconDumbbell = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M8.5 12h7" />
    <rect x="4.5" y="8.5" width="3" height="7" rx="1" />
    <rect x="16.5" y="8.5" width="3" height="7" rx="1" />
    <path d="M2.5 10.5v3M21.5 10.5v3" />
  </svg>
);
export const IconCalendar = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="4" y="5.5" width="16" height="15" rx="2.5" />
    <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
  </svg>
);
export const IconChart = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M5 20V14M10 20V9M15 20v-8M20 20V5" /></svg>
);
export const IconUser = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8.2" r="3.4" />
    <path d="M5 20c.8-3.4 3.6-5.2 7-5.2s6.2 1.8 7 5.2" />
  </svg>
);
export const IconUsers = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3.1" />
    <path d="M3.6 19c.5-2.9 2.7-4.5 5.4-4.5S13.9 16.1 14.4 19" />
    <path d="M16 5.2a3 3 0 0 1 0 5.6M17.6 14.5c2.1.5 3.5 1.9 3.9 4.5" />
  </svg>
);
export const IconTag = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 12.7V5.4A1.4 1.4 0 0 1 5.4 4h7.3a1.4 1.4 0 0 1 1 .4l6.5 6.5a1.4 1.4 0 0 1 0 2L13.9 19.2a1.4 1.4 0 0 1-2 0L4.4 13.7A1.4 1.4 0 0 1 4 12.7Z" />
    <circle cx="8.6" cy="8.6" r="1.3" />
  </svg>
);
export const IconFlame = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3.5c.6 2.8 3.1 4.4 4.5 6.5a6.4 6.4 0 1 1-10.7 1.2C7 9 9.5 8 9.5 5a5.6 5.6 0 0 0 2.5-1.5Z" />
  </svg>
);
export const IconSteps = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M5 16.5c2.5 0 3-1.5 3-3V6.8C8 5 7 4 5.9 4 4.4 4 3.5 5.2 3.5 7v5c0 3 .3 4.5 1.5 4.5Z" />
    <path d="M19 20c-2.5 0-3-1.5-3-3v-6.7c0-1.8 1-2.8 2.1-2.8 1.5 0 2.4 1.2 2.4 3v5c0 3-.3 4.5-1.5 4.5Z" />
  </svg>
);
export const IconClock = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);
export const IconArrowRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 12h16m-6-6 6 6-6 6" /></svg>
);
export const IconSettings = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.5a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.5h4l.4-2.5a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.07-.4.1-.8.1-1.2Z" />
  </svg>
);
export const IconLogout = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M14 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7" />
    <path d="M17 8l4 4-4 4M21 12H10" />
  </svg>
);
export const IconPin = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 21s-6.5-5.4-6.5-10.2a6.5 6.5 0 1 1 13 0C18.5 15.6 12 21 12 21Z" />
    <circle cx="12" cy="10.5" r="2.3" />
  </svg>
);
export const IconDoc = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M7 3.5h7L19 8v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19V5A1.5 1.5 0 0 1 6.5 3.5Z" />
    <path d="M14 3.5V8h4.5M9 12.5h6M9 16h6" />
  </svg>
);
export const IconTrophy = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
    <path d="M8 5H5a3 3 0 0 0 3 4M16 5h3a3 3 0 0 1-3 4M12 13v3.5M8.5 20h7M10 20v-2a2 2 0 0 1 4 0v2" />
  </svg>
);
