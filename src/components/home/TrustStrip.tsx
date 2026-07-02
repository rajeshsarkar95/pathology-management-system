// TrustStrip.tsx
export default function TrustStrip() {
  const items = [
    { icon: "🏥", label:"NABL Accredited"},
    { icon: "🔒", label:"HIPAA Compliant"},
    { icon: "📋", label:"ISO 15189 Certified"},
    { icon: "⭐", label:"4.9/5 Patient Rating"},
    { icon: "🚀", label:"24-Hr Reports"},
  ];
  return (
    <div className="bg-slate-50 border-y border-slate-200 py-4">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-6 md:gap-10 flex-wrap">
        {items.map((i)=>(
          <div key={i.label} className="flex items-center gap-2 text-slate-600 text-sm font-medium">
            <span>{i.icon}</span>
            {i.label}
          </div>
        ))}
      </div>
    </div>
  );
}
