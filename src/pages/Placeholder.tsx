type PlaceholderProps = {
  title: string;
  description?: string;
};

export function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl">
        {title}
      </h1>
      {description && <p className="text-sm text-slate-500">{description}</p>}
    </div>
  );
}
