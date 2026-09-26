import { memo, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import bannerService from "../services/bannerService";
import productService from "../services/productService";
import categoryService from "../services/categoryService";
import ProductCard from "../components/ProductCard";
import { getOptimizedImageUrl } from "../utils/cloudinary";

const fetchWithRetry = async (fetcherFn, maxRetries = 2, delayMs = 1200) => {
  let attempt = 0;

  while (true) {
    try {
      return await fetcherFn();
    } catch (error) {
      attempt++;

      const status = error.response?.status;
      const isTransient =
        !error.response ||
        error.code === "ECONNABORTED" ||
        error.message?.includes("timeout") ||
        error.message?.includes("Network Error") ||
        (status >= 500 && status < 600);

      if (attempt <= maxRetries && isTransient) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      throw error;
    }
  }
};

const Home = () => {
  const [banners, setBanners] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [bannerLoading, setBannerLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);

  const [categoryError, setCategoryError] = useState(false);
  const [productError, setProductError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchBanners = async () => {
      try {
        const response = await fetchWithRetry(() =>
          bannerService.getBanners({ limit: 1 })
        );
        if (!isMounted) return;

        const bannerList = Array.isArray(response)
          ? response
          : Array.isArray(response?.banners)
          ? response.banners
          : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.banners)
          ? response.data.banners
          : [];

        setBanners(bannerList);
      } catch (error) {
        console.error("Failed to load homepage banners:", error);
        if (isMounted) setBanners([]);
      } finally {
        if (isMounted) setBannerLoading(false);
      }
    };

    const fetchProducts = async () => {
      try {
        const response = await fetchWithRetry(() =>
          productService.getProducts({ limit: 8, view: "card" })
        );
        if (!isMounted) return;

        const productList = Array.isArray(response)
          ? response
          : Array.isArray(response?.products)
          ? response.products
          : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.products)
          ? response.data.products
          : [];

        setProducts(productList);
        setProductError(false);
      } catch (error) {
        console.error("Failed to load homepage products:", error);
        if (isMounted) {
          setProducts([]);
          setProductError(true);
        }
      } finally {
        if (isMounted) setProductLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await fetchWithRetry(() =>
          categoryService.getCategories()
        );
        if (!isMounted) return;

        const categoryList = Array.isArray(response)
          ? response
          : Array.isArray(response?.categories)
          ? response.categories
          : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.categories)
          ? response.data.categories
          : [];

        setCategories(categoryList);
        setCategoryError(false);
      } catch (error) {
        console.error("Failed to load homepage categories:", error);
        if (isMounted) {
          setCategories([]);
          setCategoryError(true);
        }
      } finally {
        if (isMounted) setCategoryLoading(false);
      }
    };

    fetchBanners();
    fetchProducts();
    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const mainBanner = useMemo(() => banners[0], [banners]);

  const leftBannerImage = useMemo(
    () =>
      mainBanner?.leftImage ||
      mainBanner?.image ||
      mainBanner?.imageUrl ||
      "",
    [mainBanner]
  );

  const leftBannerTitle = useMemo(
    () => mainBanner?.title || "T-Shirts for everyday wear.",
    [mainBanner]
  );

  const leftBannerSubtitle = useMemo(
    () =>
      mainBanner?.subtitle ||
      "Graphic, oversized, plain and custom T-shirts for everyday wear.",
    [mainBanner]
  );

  const leftBannerButtonText = useMemo(
    () => mainBanner?.buttonText || "Shop T-Shirts",
    [mainBanner]
  );

  const leftBannerButtonLink = useMemo(
    () => mainBanner?.buttonLink || "/products",
    [mainBanner]
  );

  const rightBannerImage = useMemo(
    () =>
      mainBanner?.rightImage ||
      mainBanner?.image ||
      mainBanner?.imageUrl ||
      "",
    [mainBanner]
  );

  const rightBannerTitle = useMemo(
    () =>
      mainBanner?.rightTitle ||
      mainBanner?.title ||
      "New Arrivals",
    [mainBanner]
  );

  const rightBannerSubtitle = useMemo(
    () =>
      mainBanner?.rightSubtitle ||
      mainBanner?.subtitle ||
      "Fresh designs. Same comfort.",
    [mainBanner]
  );

  const rightBannerButtonText = useMemo(
    () =>
      mainBanner?.rightButtonText ||
      mainBanner?.buttonText ||
      "Shop Now",
    [mainBanner]
  );

  const rightBannerButtonLink = useMemo(
    () =>
      mainBanner?.rightButtonLink ||
      mainBanner?.buttonLink ||
      "/products",
    [mainBanner]
  );

  const homeProducts = useMemo(() => products.slice(0, 8), [products]);

  const categoryData = useMemo(
    () =>
      categories
        .map((category) => {
          const categoryName = String(category?.name || "").trim();

          return {
            id: category?._id || category?.id || categoryName,
            name: categoryName,
            subtitle:
              typeof category?.description === "string"
                ? category.description.trim() || "Explore collection"
                : "Explore collection",
            link: `/products?category=${encodeURIComponent(categoryName)}`,
            image: category?.image || category?.imageUrl || null,
          };
        })
        .filter((category) => category.name),
    [categories]
  );

  return (
    <div className="min-h-screen bg-white text-[#171717]">
      <section className="bg-white">
        <div className="mx-auto max-w-350 px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
          {bannerLoading ? (
            <div className="grid h-90 animate-pulse gap-3 sm:h-107.5 lg:h-111.25 lg:grid-cols-[minmax(0,2.2fr)_minmax(280px,0.9fr)]">
              <div className="rounded-xl bg-[#FFF4E8]" />

              <div className="hidden rounded-xl bg-[#FFF0E3] lg:block" />
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-[minmax(0,2.2fr)_minmax(280px,0.9fr)]">
              <div className="relative min-h-90 overflow-hidden rounded-xl bg-[#FFF4E8] sm:min-h-107.5 lg:min-h-111.25">
                {leftBannerImage ? (
                  <img
                    src={getOptimizedImageUrl(leftBannerImage, {
                      width: 1000,
                      crop: "limit",
                      format: "auto",
                      quality: "auto",
                    })}
                    alt={leftBannerTitle}
                    width={1000}
                    height={445}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#FFF4E8]" />
                )}

                <div className="absolute inset-0 bg-linear-to-r from-[#FFF8F0]/90 via-[#FFF8F0]/45 to-transparent" />

                <div className="relative z-10 flex h-full items-center">
                  <div className="w-full max-w-132.5 px-7 py-10 sm:px-10 lg:px-12">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-black/55">
                      CustomTee
                    </p>

                    <h1 className="mt-5 max-w-125 text-4xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-5xl lg:text-[52px]">
                      {leftBannerTitle}
                    </h1>

                    <p className="mt-5 max-w-102.5 text-sm leading-6 text-black/60 sm:text-base">
                      {leftBannerSubtitle}
                    </p>

                    <Link
                      to={leftBannerButtonLink}
                      className="mt-7 inline-flex items-center bg-black px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#242424]"
                    >
                      {leftBannerButtonText}

                      <span className="ml-6 text-lg">
                        →
                      </span>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="relative min-h-75 overflow-hidden rounded-xl bg-[#FFF0E3] sm:min-h-90 lg:min-h-111.25">
                {rightBannerImage ? (
                  <img
                    src={getOptimizedImageUrl(rightBannerImage, { width: 600, crop: "limit" })}
                    alt={rightBannerTitle}
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#FFF0E3]" />
                )}

                <div className="absolute inset-0 bg-linear-to-r from-[#FFF8F0]/90 via-[#FFF8F0]/45 to-transparent" />

                <div className="relative z-10 flex h-full items-start">
                  <div className="max-w-60 px-7 py-8 sm:px-8 sm:py-10">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-black/45">
                      New
                    </p>

                    <h2 className="mt-2 text-3xl font-semibold uppercase leading-[0.95] tracking-[-0.04em] sm:text-4xl">
                      {rightBannerTitle}
                    </h2>

                    <p className="mt-4 text-sm leading-5 text-black/60">
                      {rightBannerSubtitle}
                    </p>

                    <Link
                      to={rightBannerButtonLink}
                      className="mt-6 inline-flex items-center bg-black px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#242424]"
                    >
                      {rightBannerButtonText}

                      <span className="ml-5 text-base">
                        →
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-312.5 px-5 pb-14 pt-10 sm:px-6 sm:pb-16 lg:px-8">
          <div className="text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-black/40">
              Shop by style
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Find your T-shirt
            </h2>
          </div>

          {categoryLoading ? (
            <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className={`rounded-2xl p-5 text-center ${
                    item % 2 === 1
                      ? "bg-white"
                      : "bg-[#FFF4E8]"
                  }`}
                >
                  <div className="mx-auto aspect-square w-full max-w-37.5 animate-pulse rounded-full bg-[#EDE8E2]" />

                  <div className="mx-auto mt-4 h-4 w-24 animate-pulse rounded bg-[#EAE5DF]" />

                  <div className="mx-auto mt-2 h-3 w-28 animate-pulse rounded bg-[#EAE5DF]" />
                </div>
              ))}
            </div>
          ) : categoryData.length > 0 ? (
            <div
              className={`mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 ${
                categoryData.length >= 5
                  ? "lg:grid-cols-5"
                  : categoryData.length === 4
                  ? "lg:grid-cols-4"
                  : categoryData.length === 3
                  ? "lg:grid-cols-3"
                  : "lg:grid-cols-2"
              }`}
            >
              {categoryData.map((category, index) => {
                const isOrange = index % 2 === 1;

                return (
                  <Link
                    key={category.id}
                    to={category.link}
                    className={`group rounded-2xl p-5 text-center transition duration-300 hover:-translate-y-1 ${
                      isOrange
                        ? "bg-[#FFF4E8]"
                        : "bg-white"
                    }`}
                  >
                    <div
                      className={`mx-auto aspect-square w-full max-w-41.25 overflow-hidden rounded-full ${
                        isOrange
                          ? "bg-[#FFE7CF]"
                          : "bg-[#F4F4F4]"
                      }`}
                    >
                      {category.image ? (
                        <img
                          src={getOptimizedImageUrl(category.image, {
                            width: 300,
                            crop: "fill",
                            gravity: "auto",
                          })}
                          alt={category.name}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="px-3 text-sm font-semibold uppercase tracking-[0.15em] text-black/25">
                            {category.name}
                          </span>
                        </div>
                      )}
                    </div>

                    <h3 className="mt-5 text-base font-semibold tracking-[-0.02em]">
                      {category.name}
                    </h3>

                    <p className="mx-auto mt-2 max-w-47.5 text-xs leading-5 text-black/45">
                      {category.subtitle}
                    </p>
                  </Link>
                );
              })}
            </div>
          ) : categoryError ? (
            <div className="mt-10 py-12 text-center">
              <p className="text-sm text-black/45">
                Unable to load categories right now.
              </p>
            </div>
          ) : (
            <div className="mt-10 py-12 text-center">
              <p className="text-sm text-black/45">
                No categories available right now.
              </p>
            </div>
          )}

          <div className="mt-10 text-center">
            <Link
              to="/products"
              className="inline-flex items-center border border-black/50 px-7 py-3 text-xs font-medium transition hover:bg-black hover:text-white"
            >
              View All Collections

              <span className="ml-5 text-base">
                →
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-black/10 bg-[#FFF4E8]">
        <main className="mx-auto max-w-350 px-5 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="flex items-end justify-between border-b border-black/10 pb-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-black/40">
                Latest collection
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
                T-Shirts
              </h2>
            </div>

            <Link
              to="/products"
              className="hidden text-sm font-medium underline underline-offset-4 sm:block"
            >
              View all
            </Link>
          </div>

          {productLoading ? (
            <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(
                (item) => (
                  <div
                    key={item}
                    className={`rounded-xl p-3 ${
                      item % 2 === 1
                        ? "bg-white"
                        : "bg-[#FFF8F1]"
                    }`}
                  >
                    <div className="aspect-square animate-pulse bg-[#EDE8E2]" />

                    <div className="mt-4 h-4 w-3/4 animate-pulse bg-[#EDE8E2]" />

                    <div className="mt-2 h-3 w-1/3 animate-pulse bg-[#EDE8E2]" />

                    <div className="mt-4 h-4 w-1/4 animate-pulse bg-[#EDE8E2]" />
                  </div>
                )
              )}
            </div>
          ) : homeProducts.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {homeProducts.map((product, index) => (
                <div
                  key={
                    product?._id ||
                    product?.id
                  }
                  className={`rounded-xl p-3 ${
                    index % 2 === 0
                      ? "bg-white"
                      : "bg-[#FFF8F1]"
                  }`}
                >
                  <ProductCard
                    product={product}
                  />
                </div>
              ))}
            </div>
          ) : productError ? (
            <div className="py-20 text-center">
              <p className="text-sm text-black/45">
                Unable to load products right now.
              </p>

              <Link
                to="/products"
                className="mt-4 inline-block text-sm font-medium underline underline-offset-4"
              >
                Browse products
              </Link>
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-sm text-black/45">
                No products available right now.
              </p>

              <Link
                to="/products"
                className="mt-4 inline-block text-sm font-medium underline underline-offset-4"
              >
                Browse products
              </Link>
            </div>
          )}

          <div className="mt-10 text-center">
            <Link
              to="/products"
              className="inline-flex items-center border border-black px-7 py-3 text-sm font-medium transition hover:bg-black hover:text-white"
            >
              View All T-Shirts

              <span className="ml-5">
                →
              </span>
            </Link>
          </div>
        </main>
      </section>
    </div>
  );
};

export default memo(Home);