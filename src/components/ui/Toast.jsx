export default function Toast({ message, visible }) {
  return (
    <div
      className="fixed bottom-24 left-1/2 z-[100] pointer-events-none"
      style={{
        opacity: visible ? 1 : 0,
        transform: `translateX(-50%) translateY(${visible ? 0 : 8}px)`,
        transition: 'all .3s ease',
      }}
    >
      <div className="bg-gray-900 text-white px-5 py-3 rounded-2xl text-sm font-medium whitespace-nowrap shadow-xl">
        {message}
      </div>
    </div>
  );
}
