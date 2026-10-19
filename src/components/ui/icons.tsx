import type { ReactNode } from "react";

/* Ícones de traço (24×24) do tema "Noite Azul". Decorativos: o texto do botão ou o aria-label dá o nome. */

interface IconProps {
  className?: string;
  strokeWidth?: number;
}

function Icon({ className = "w-5 h-5", strokeWidth = 2, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p: IconProps) => (
  <Icon {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" /></Icon>
);
export const BoxIcon = (p: IconProps) => (
  <Icon {...p}><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="m3 8 9 5 9-5" /><path d="M12 13v8" /></Icon>
);
export const ScanIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 8V6a2 2 0 0 1 2-2h2" /><path d="M16 4h2a2 2 0 0 1 2 2v2" />
    <path d="M20 16v2a2 2 0 0 1-2 2h-2" /><path d="M8 20H6a2 2 0 0 1-2-2v-2" />
    <path d="M8 9v6" /><path d="M11 9v6" /><path d="M14 9v6" /><path d="M16.5 9v6" />
  </Icon>
);
export const DocumentIcon = (p: IconProps) => (
  <Icon {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" /><path d="M14 3v5h5" /><path d="M9 13h6" /><path d="M9 17h6" /></Icon>
);
export const ChartIcon = (p: IconProps) => (
  <Icon {...p}><path d="M3 20h18" /><path d="M6 16v-4" /><path d="M11 16V6" /><path d="M16 16V9" /></Icon>
);
export const UsersIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0" /><path d="M16 3.5a4 4 0 0 1 0 9" /><path d="M22 21a7 7 0 0 0-4-6.3" /></Icon>
);
export const SlidersIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 6h9" /><path d="M19 6h1" /><circle cx="16" cy="6" r="2.5" />
    <path d="M4 12h2" /><path d="M12 12h8" /><circle cx="9" cy="12" r="2.5" />
    <path d="M4 18h11" /><circle cx="18" cy="18" r="2.5" />
  </Icon>
);
export const BellIcon = (p: IconProps) => (
  <Icon {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></Icon>
);
export const SearchIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>
);
export const PlusIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 5v14" /><path d="M5 12h14" /></Icon>
);
export const MinusIcon = (p: IconProps) => (
  <Icon {...p}><path d="M5 12h14" /></Icon>
);
export const PlusMinusIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 4v8" /><path d="M8 8h8" /><path d="M8 18h8" /></Icon>
);
export const ArrowRightIcon = (p: IconProps) => (
  <Icon {...p}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></Icon>
);
export const ArrowLeftIcon = (p: IconProps) => (
  <Icon {...p}><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></Icon>
);
export const ArrowUpRightIcon = (p: IconProps) => (
  <Icon {...p}><path d="M7 17 17 7" /><path d="M8 7h9v9" /></Icon>
);
export const ChevronsUpDownIcon = (p: IconProps) => (
  <Icon {...p}><path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" /></Icon>
);
export const ChevronDownIcon = (p: IconProps) => (
  <Icon {...p}><path d="m6 9 6 6 6-6" /></Icon>
);
export const PencilIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" /></Icon>
);
export const CheckIcon = (p: IconProps) => (
  <Icon {...p}><path d="m5 12 5 5 9-10" /></Icon>
);
export const XIcon = (p: IconProps) => (
  <Icon {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icon>
);
export const MailIcon = (p: IconProps) => (
  <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></Icon>
);
export const BanIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="m5.6 5.6 12.8 12.8" /></Icon>
);
export const MenuIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></Icon>
);
export const LayersIcon = (p: IconProps) => (
  <Icon {...p}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></Icon>
);
export const CameraIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 8a2 2 0 0 1 2-2h1.5l1.3-2h6.4l1.3 2H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" /><circle cx="12" cy="12.5" r="3.5" /></Icon>
);
export const ImageIcon = (p: IconProps) => (
  <Icon {...p}><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="9.5" r="1.8" /><path d="m21 15-4.5-4.5L8 19" /></Icon>
);
export const TrashIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" /><path d="M9 7V4h6v3" /></Icon>
);
/** Entrada no estoque */
export const InIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 4v11" /><path d="m7 10 5 5 5-5" /><path d="M5 20h14" /></Icon>
);
/** Saída do estoque */
export const OutIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 20V9" /><path d="m7 14 5-5 5 5" /><path d="M5 4h14" /></Icon>
);

export function Spinner({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export const CartIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2.5 3h2.6l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.9a1.5 1.5 0 0 0 1.5-1.2L21 7H6.2" /></Icon>
);
