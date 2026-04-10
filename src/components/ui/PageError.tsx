interface Props { message?: string; onRetry?: () => void }

export default function PageError({ message = "Algo deu errado.", onRetry }: Props) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3">
      <p className="text-slate-400 text-sm">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-xs text-brand-400 hover:text-brand-300 cursor-pointer transition-colors duration-200"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
