interface LayoutContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function LayoutContainer({ children, className = "" }: LayoutContainerProps) {
  return (
    <div className={`w-full max-w-5xl mx-auto px-4 sm:px-6 ${className}`}>
      {children}
    </div>
  );
}
