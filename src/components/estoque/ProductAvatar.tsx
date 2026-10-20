import { productInitials } from "@/lib/stock";
import { iconeDoProduto, urlIcone, ehFotoDeEmbalagem } from "@/lib/iconeProduto";

const SIZES = {
  sm: "w-11 h-11 text-sm",
  md: "w-12 h-12 text-[15px]",
  lg: "w-16 h-16 text-xl",
};

interface ProductAvatarProps {
  name: string;
  imageUrl?: string | null;
  /** Ícone escolhido à mão (products.icon); sem ele, o ícone sai do nome */
  icon?: string | null;
  size?: keyof typeof SIZES;
  /** "ink" para quando o avatar fica sobre um fundo surface-2 ou sobre o card claro */
  tone?: "surface" | "ink";
}

/**
 * Imagem do produto em círculo (EQZ-30), nesta ordem: foto (da pessoa ou da embalagem no Open
 * Food Facts) → ícone escolhido à mão → ícone pelo nome → iniciais.
 */
export default function ProductAvatar({ name, imageUrl, icon, size = "md", tone = "surface" }: ProductAvatarProps) {
  const embalagem = ehFotoDeEmbalagem(imageUrl);
  const icone     = imageUrl ? null : iconeDoProduto(name, icon);

  return (
    <span
      className={`${SIZES[size]} rounded-full overflow-hidden flex items-center justify-center font-black text-fg shrink-0 ${
        embalagem ? "bg-white" : tone === "ink" ? "bg-ink" : "bg-surface-2"
      }`}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className={embalagem ? "w-full h-full object-contain p-1" : "w-full h-full object-cover"}
        />
      ) : icone ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={urlIcone(icone)} alt="" loading="lazy" decoding="async" className="w-[66%] h-[66%] object-contain" />
      ) : (
        productInitials(name)
      )}
    </span>
  );
}
