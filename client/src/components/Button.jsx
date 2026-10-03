export default function Button({ children, type = 'button', variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-brand-700 text-white hover:bg-brand-800',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  return (
    <button
      type={type}
      className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
