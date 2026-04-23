import { I } from './Icons';

export default function Chk({ checked, onChange }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border-0 cursor-pointer transition-all duration-150
      ${checked ? "bg-blue-500 shadow-sm shadow-blue-200" : "bg-gray-100 hover:bg-gray-200"}`}
    >
      <I.Check />
    </button>
  );
}
