import Image from "next/image";

export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <Image
      src="/logo.png"
      alt="Estoquizen"
      width={size}
      height={size}
      className="rounded-lg flex-shrink-0"
      priority
    />
  );
}
