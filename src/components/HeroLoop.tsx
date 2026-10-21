"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Vídeo curto em loop no hero da landing (o app em uso). Feito no HyperFrames, projeto em
 * Documents/Estoquizen Anuncio/videos/estoquizen-hero-loop; 880 × 1244 (o dobro do card), 8,5 s,
 * sem áudio, fundo #111A2C (bg-panel). Decorativo: sem controles, sem foco, fora do leitor de tela.
 *
 * Peso: a capa (61 KB) vem com a página; o vídeo (1,1 MB) só depois do "load" e com o card perto
 * da tela, e nunca para quem pediu "reduzir movimento", "economia de dados" ou está em rede lenta.
 */

const CAPA = "/hero/estoquizen-hero-loop-capa.webp";

type InfoRede = { saveData?: boolean; effectiveType?: string };

function podeCarregarVideo() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const rede = (navigator as Navigator & { connection?: InfoRede }).connection;
  if (rede?.saveData) return false;
  if (rede?.effectiveType && ["slow-2g", "2g", "3g"].includes(rede.effectiveType)) return false;
  return true;
}

export default function HeroLoop() {
  const cardRef  = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [carregar, setCarregar] = useState(false);
  const [tocando, setTocando]   = useState(false);

  /* Espera a página terminar de carregar e o card chegar perto da tela */
  useEffect(() => {
    const card = cardRef.current;
    if (!card || !podeCarregarVideo()) return;
    let io: IntersectionObserver | null = null;
    const observar = () => {
      io = new IntersectionObserver((entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setCarregar(true);
          io?.disconnect();
        }
      }, { rootMargin: "200px" });
      io.observe(card);
    };
    if (document.readyState === "complete") observar();
    else window.addEventListener("load", observar, { once: true });
    return () => {
      window.removeEventListener("load", observar);
      io?.disconnect();
    };
  }, []);

  /* Toca só enquanto aparece na tela (fora dela, pausa e poupa bateria) */
  useEffect(() => {
    const video = videoRef.current;
    const card  = cardRef.current;
    if (!carregar || !video || !card) return;
    video.muted = true;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) video.play().catch(() => { /* autoplay bloqueado: fica a capa */ });
      else video.pause();
    });
    io.observe(card);
    return () => io.disconnect();
  }, [carregar]);

  return (
    <div
      ref={cardRef}
      aria-hidden="true"
      className="relative w-full max-w-[440px] mx-auto rounded-[40px] bg-panel shadow-lift overflow-hidden aspect-[880/1244]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={CAPA} alt="" width={880} height={1244} className="absolute inset-0 w-full h-full object-cover" />
      {carregar && (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="auto"
          poster={CAPA}
          aria-hidden="true"
          onPlaying={() => setTocando(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 motion-reduce:hidden ${
            tocando ? "opacity-100" : "opacity-0"
          }`}
        >
          <source src="/hero/estoquizen-hero-loop.webm" type="video/webm" />
          <source src="/hero/estoquizen-hero-loop.mp4" type="video/mp4" />
        </video>
      )}
    </div>
  );
}
