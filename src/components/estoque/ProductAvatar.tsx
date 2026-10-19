import { productInitials } from "@/lib/stock";

const SIZES = {
  sm: "w-11 h-11 text-sm",
  md: "w-12 h-12 text-[15px]",
  lg: "w-16 h-16 text-xl",
};

interface ProductAvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: keyof typeof SIZES;
  /** "ink" para quando o avatar fica sobre um fundo surface-2 ou sobre o card claro */
  tone?: "surface" | "ink";
}

/** Foto do produto em círculo; sem foto, as iniciais do nome. */
export default function ProductAvatar({ name, imageUrl, size = "md", tone = "surface" }: ProductAvatarProps) {
  return (
    <span
      className={`${SIZES[size]} rounded-full overflow-hidden flex items-center justify-center font-black text-fg shrink-0 ${
        tone === "ink" ? "bg-ink" : "bg-surface-2"
      }`}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
      ) : (
        productInitials(name)
      )}
    </span>
  );
}
