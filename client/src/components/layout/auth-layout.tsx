interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="absolute top-4 left-4">
        <h1 className="text-xl font-bold text-amber-900">Post Media</h1>
      </div>
      {children}
    </div>
  );
}
