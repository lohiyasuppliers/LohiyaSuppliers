interface AccountPageHeaderProps {
  title: string;
  subtitle?: string;
}

export function AccountPageHeader({ title, subtitle }: AccountPageHeaderProps) {
  return (
    <div className="mb-8 animate-fade-in-up">
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
