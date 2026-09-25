const Toast = ({ notification, onClose }) => {
  if (!notification) {
    return null;
  }

  const typeStyles = {
    success: {
      container: "border-gray-200 bg-white text-gray-800",
      icon: "✓",
      iconColor: "text-green-600",
    },

    error: {
      container: "border-gray-200 bg-white text-gray-800",
      icon: "!",
      iconColor: "text-red-600",
    },

    warning: {
      container: "border-gray-200 bg-white text-gray-800",
      icon: "!",
      iconColor: "text-yellow-600",
    },

    info: {
      container: "border-gray-200 bg-white text-gray-800",
      icon: "i",
      iconColor: "text-blue-600",
    },
  };

  const style =
    typeStyles[notification.type] || typeStyles.info;

  return (
    <div
      role="alert"
      className={`fixed right-5 top-16 z-9999 flex max-w-[calc(100vw-40px)] items-center gap-2.5 rounded-md border px-3.5 py-2.5 shadow-sm ${style.container}`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center text-xs font-semibold ${style.iconColor}`}
      >
        {style.icon}
      </span>

      <p className="text-[13px] font-medium leading-5">
        {notification.message}
      </p>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close notification"
        className="ml-1 text-base leading-none text-gray-400 transition hover:text-gray-700"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;