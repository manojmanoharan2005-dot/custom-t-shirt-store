let razorpayLoadingPromise = null;

export const loadRazorpaySDK = () => {
  if (typeof window !== "undefined" && window.Razorpay) {
    return Promise.resolve(true);
  }

  if (razorpayLoadingPromise) {
    return razorpayLoadingPromise;
  }

  razorpayLoadingPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), {
        once: true,
      });
      existingScript.addEventListener(
        "error",
        () => {
          razorpayLoadingPromise = null;
          reject(new Error("Failed to load Razorpay SDK script"));
        },
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => {
      resolve(true);
    };

    script.onerror = () => {
      razorpayLoadingPromise = null;
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      reject(new Error("Failed to load Razorpay SDK from network"));
    };

    document.body.appendChild(script);
  });

  return razorpayLoadingPromise;
};

export default loadRazorpaySDK;