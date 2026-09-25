import { useState } from "react";

const SearchBar = ({
  onSearch,
  placeholder = "Search T-shirts...",
}) => {
  const [search, setSearch] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    onSearch(search.trim());
  };

  const handleClear = () => {
    setSearch("");
    onSearch("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-2xl gap-2"
    >
      <div className="relative flex-1">
        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder={placeholder}
          aria-label="Search T-shirts"
          className="h-10 w-full rounded-none border border-gray-300 bg-white px-3 pr-9 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-black"
        />

        {search && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-base leading-none text-gray-400 transition-colors hover:text-black"
          >
            ×
          </button>
        )}
      </div>

      <button
        type="submit"
        className="h-10 bg-black px-5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
      >
        Search
      </button>
    </form>
  );
};

export default SearchBar;