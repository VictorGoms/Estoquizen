/*
 * Vídeo curto em loop no hero da landing (o app em uso). Feito no HyperFrames, projeto em
 * Documents/Estoquizen Anuncio/videos/estoquizen-hero-loop; 880 × 1244 (o dobro do card), 8,5 s,
 * sem áudio, fundo #111A2C (bg-panel). Decorativo: sem controles, sem foco, fora do leitor de tela.
 * Com "reduzir movimento" só a capa aparece.
 */
export default function HeroLoop() {
  return (
    <div
      aria-hidden="true"
      className="relative w-full max-w-[440px] mx-auto rounded-[40px] bg-panel shadow-lift overflow-hidden aspect-[880/1244]"
    >
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/hero/estoquizen-hero-loop-capa.webp"
        aria-hidden="true"
        className="block w-full h-full object-cover motion-reduce:hidden"
      >
        <source src="/hero/estoquizen-hero-loop.webm" type="video/webm" />
        <source src="/hero/estoquizen-hero-loop.mp4" type="video/mp4" />
      </video>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hero/estoquizen-hero-loop-capa.webp"
        alt=""
        width={880}
        height={1244}
        className="hidden motion-reduce:block w-full h-full object-cover"
      />
    </div>
  );
}
