import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { getOptimizedImageUrl } from "../utils/cloudinary";

const COLOR_MAP = {
  black: "#000000",
  white: "#ffffff",
  cream: "#f5f5dc",
  beige: "#f5f5dc",
  navy: "#000080",
  blue: "#0000ff",
  red: "#ff0000",
  green: "#008000",
  yellow: "#ffff00",
  orange: "#ffa500",
  purple: "#800080",
  pink: "#ffc0cb",
  brown: "#8b4513",
  maroon: "#800000",
  grey: "#808080",
  gray: "#808080",
  teal: "#008080",
  olive: "#808000",
};

const getColorValue = (color) => {
  const value = color?.trim();

  if (!value) {
    return "#e5e7eb";
  }

  return COLOR_MAP[value.toLowerCase()] || value;
};

const ProductCard = ({ product }) => {
  const firstVariant = product?.variants?.[0];

  const image = firstVariant?.image || "";

  const colors = useMemo(() => {
    return [
      ...new Set(
        (product?.variants || [])
          .map((variant) => variant?.color?.trim())
          .filter(Boolean)
      ),
    ];
  }, [product?.variants]);

  return (
    <article className="group">
      <Link
        to={`/products/${product._id}`}
        className="block overflow-hidden bg-[#e9e7e3]"
      >
        <div className="aspect-square">
          {image ? (
            <img
              src={getOptimizedImageUrl(image, { width: 400, crop: "fill" })}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-black/35">
              No product image
            </div>
          )}
        </div>
      </Link>

      <div className="pt-4">
        <Link
          to={`/products/${product._id}`}
          className="block"
        >
          <h3 className="truncate text-[15px] font-medium tracking-[-0.01em] text-black transition group-hover:underline group-hover:underline-offset-4">
            {product.name}
          </h3>
        </Link>

        <p className="mt-1 text-xs text-black/45">
          {product.category}
        </p>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[15px] font-semibold text-black">
            ₹{Number(product.price || 0).toLocaleString("en-IN")}
          </p>

          {colors.length > 0 && (
            <div
              className="flex items-center gap-1.5"
              aria-label={`Available colors: ${colors.join(", ")}`}
            >
              {colors.map((color) => (
                <span
                  key={color}
                  title={color}
                  aria-label={color}
                  className="h-3.5 w-3.5 rounded-full border border-black/20"
                  style={{
                    backgroundColor: getColorValue(color),
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <Link
          to={`/products/${product._id}`}
          className="mt-3 inline-flex items-center text-xs font-medium text-black/60 transition group-hover:text-black"
        >
          View Product

          <span className="ml-2 text-sm transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </Link>
      </div>
    </article>
  );
};

export default memo(ProductCard);