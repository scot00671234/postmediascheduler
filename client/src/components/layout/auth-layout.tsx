interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="absolute top-4 left-4">
        <h1 className="text-xl font-bold text-slate-800">Post Media</h1>
      </div>
      {children}
    </div>
  );
}
