import * as React from "react";

export function Combobox({ options, value, onChange, placeholder }) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const ref = React.useRef(null);

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter(
    (opt) => opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="w-full border rounded px-3 py-2 text-left bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
        onClick={() => setOpen((o) => !o)}
      >
        {value ? options.find((o) => o.value === value)?.label : placeholder || "Select..."}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-48 overflow-auto">
          <input
            className="w-full px-2 py-1 border-b outline-none"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-gray-400">No options</div>
          )}
          {filtered.map((opt) => (
            <div
              key={opt.value}
              className={`px-3 py-2 cursor-pointer hover:bg-orange-100 ${value === opt.value ? "bg-orange-50 font-bold" : ""}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
                setSearch("");
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Combobox;
