interface InfoBannerProps {
  icon?: React.ReactNode;
  title: string;
  body: string;
  onDismiss?: () => void;
}

const LightbulbIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

export default function InfoBanner({ icon, title, body, onDismiss }: InfoBannerProps) {
  return (
    <div
      className="rounded-2xl px-4 py-4 flex items-start gap-3 relative"
      style={{
        background: "rgba(29,78,216,0.1)",
        border: "1px solid rgba(59,130,246,0.18)",
      }}
    >
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-brand-400 mt-0.5"
        style={{ background: "rgba(29,78,216,0.2)" }}
      >
        {icon ?? <LightbulbIcon />}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-xs font-semibold text-brand-300 mb-0.5">{title}</p>
        <p className="text-xs text-slate-400 leading-relaxed">{body}</p>
      </div>

      {/* Dismiss */}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fechar dica"
          className="absolute top-3 right-3 text-slate-600 hover:text-slate-400 transition-colors duration-200 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
