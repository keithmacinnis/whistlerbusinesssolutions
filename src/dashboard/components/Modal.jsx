export default function Modal({ title, onClose, children, wide, extraWide }) {
  const width = extraWide ? 'max-w-4xl' : wide ? 'max-w-3xl' : 'max-w-lg'
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`max-h-[92vh] w-full ${width} overflow-y-auto rounded-2xl bg-white shadow-2xl`}
      >
        {title ? (
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-6 py-4 backdrop-blur">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-2xl leading-none text-gray-400 hover:text-gray-600"
            >
              &times;
            </button>
          </div>
        ) : null}
        <div className={title ? 'px-6 py-5' : 'p-0'}>{children}</div>
      </div>
    </div>
  )
}
