// src/components/form/RequiredLabel.tsx

type RequiredLabelProps = {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
};

export default function RequiredLabel({
  children,
  required = false,
  className = "",
}: RequiredLabelProps) {
  return (
    <label
      className={`block text-xs font-medium text-slate-500 mb-1 ${className}`}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}