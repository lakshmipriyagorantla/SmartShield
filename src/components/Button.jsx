export default function Button({ children, variant = 'primary', onClick, type = 'button', className = '', ...props }) {
  const colors = {
    primary: 'bg-emerald-700 text-white hover:bg-emerald-800',
    secondary: 'bg-sky-100 text-sky-900 hover:bg-sky-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100',
  }

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-lg font-semibold shadow-sm transition focus:outline-none focus:ring-4 focus:ring-emerald-200 ${colors[variant]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}
