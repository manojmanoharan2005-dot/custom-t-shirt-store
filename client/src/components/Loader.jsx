const Loader = ({ text = "Loading..." }) => {
  return (
    <div className="flex min-h-16 items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-black" />

        <span className="text-sm text-gray-500">
          {text}
        </span>
      </div>
    </div>
  );
};

export default Loader;