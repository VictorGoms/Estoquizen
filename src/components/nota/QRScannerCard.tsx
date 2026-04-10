"use client";

interface QRScannerCardProps {
  onClick: () => void;
}

const QRIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8H3m2 8H3m18-8h-2M7 20H4m17-8h2M7 4H4m17 0h-2M7 20v-4m10-8v3m0 0h.01m-9.01 0h-.01M12 8V4m0 16v-4" />
  </svg>
);

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default function QRScannerCard({ onClick }: QRScannerCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-2xl flex flex-col items-center justify-center gap-4 py-10 px-6 cursor-pointer transition-all duration-250 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
      style={{
        background: "rgba(30,41,59,0.6)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(29,78,216,0.12)";
        e.currentTarget.style.borderColor = "rgba(59,130,246,0.35)";
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(37,99,235,0.2)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(30,41,59,0.6)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
        e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.2)";
        e.currentTarget.style.transform = "";
      }}
      aria-label="Escanear QR Code da nota fiscal"
    >
      {/* QR icon container */}
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center text-brand-400 transition-all duration-250 group-hover:scale-110 group-hover:text-brand-300"
        style={{
          background: "rgba(29,78,216,0.15)",
          border: "1px solid rgba(59,130,246,0.2)",
        }}
      >
        <QRIcon />
      </div>

      {/* Label */}
      <div className="text-center">
        <p className="font-display font-semibold text-white text-base group-hover:text-brand-200 transition-colors duration-200">
          Escanear QR Code
        </p>
        <p className="text-slate-500 text-xs mt-1">
          Aponte a câmera para o código da NF-e
        </p>
      </div>

      {/* Camera badge */}
      <div
        className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full transition-all duration-200"
        style={{
          background: "rgba(59,130,246,0.1)",
          border: "1px solid rgba(59,130,246,0.2)",
          color: "#93C5FD",
        }}
      >
        <CameraIcon />
        Abrir câmera
      </div>
    </button>
  );
}
