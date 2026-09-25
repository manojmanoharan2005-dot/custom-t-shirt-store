import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

import Toast from "../components/Toast";

const NotificationContext = createContext(null);

export const NotificationProvider = ({
  children,
}) => {
  const [notification, setNotification] =
    useState(null);

  const timeoutRef = useRef(null);

  const showNotification = useCallback(
    (
      message,
      type = "success",
      duration = 3000
    ) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setNotification({
        id: Date.now(),
        message,
        type,
      });

      timeoutRef.current = setTimeout(() => {
        setNotification(null);
      }, duration);
    },
    []
  );

  const hideNotification = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setNotification(null);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        hideNotification,
      }}
    >
      {children}

      <Toast
        notification={notification}
        onClose={hideNotification}
      />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(
    NotificationContext
  );

  if (!context) {
    throw new Error(
      "useNotification must be used inside NotificationProvider"
    );
  }

  return context;
};