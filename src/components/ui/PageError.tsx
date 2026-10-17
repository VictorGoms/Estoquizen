interface Props { message?: string; onRetry?: () => void }

export default function PageError({ message = "Algo deu errado.", onRetry }: Props) {
  return (
    <div role="alert" className="flex-1 flex flex-col items-center justify-center py-24 gap-4 text-center px-4">
      <p className="text-[15px] font-bold text-fg-muted max-w-sm">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-[44px] px-5 rounded-full bg-surface-2 text-sm font-extrabold cursor-pointer hover:bg-white/10 transition-colors"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
