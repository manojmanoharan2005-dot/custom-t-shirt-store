import { useEffect, useState } from "react";

import ProductCard from "../components/ProductCard";
import SearchBar from "../components/SearchBar";
import Loader from "../components/Loader";

import productService from "../services/productService";
import categoryService from "../services/categoryService";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showFilters, setShowFilters] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [filters, setFilters] = useState({
    search: "",
    category: "",
    size: "",
    color: "",
    minPrice: "",
    maxPrice: "",
  });

  const extractColors = (productList) => {
    const colors = [
      ...new Set(
        productList
          .flatMap((product) =>
            (product?.variants || []).map(
              (variant) => variant?.color?.trim()
            )
          )
          .filter(Boolean)
      ),
    ];

    return colors.sort((a, b) =>
      a.localeCompare(b)
    );
  };

  const loadProducts = async (currentFilters = filters, targetPage = 1) => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page: targetPage,
        limit: 12,
        view: "card",
      };

      if (currentFilters.search.trim()) {
        params.search = currentFilters.search.trim();
      }

      if (currentFilters.category) {
        params.category = currentFilters.category;
      }

      if (currentFilters.size) {
        params.size = currentFilters.size;
      }

      if (currentFilters.color.trim()) {
        params.color = currentFilters.color.trim();
      }

      if (currentFilters.minPrice !== "") {
        params.minPrice = currentFilters.minPrice;
      }

      if (currentFilters.maxPrice !== "") {
        params.maxPrice = currentFilters.maxPrice;
      }

      const response =
        await productService.getProducts(params);

      const loadedProducts =
        response.products || [];

      setProducts(loadedProducts);
      setTotalPages(response.totalPages || 1);
      setTotalCount(response.count || 0);

      if (
        !currentFilters.search &&
        !currentFilters.category &&
        !currentFilters.size &&
        !currentFilters.color &&
        currentFilters.minPrice === "" &&
        currentFilters.maxPrice === ""
      ) {
        setColorOptions(
          extractColors(loadedProducts)
        );
      }
    } catch (error) {
      console.error(
        "Failed to load products:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response =
        await categoryService.getCategories();

      setCategories(
        response.categories || []
      );
    } catch (error) {
      console.error(
        "Failed to load categories:",
        error
      );
    }
  };

  useEffect(() => {
    loadProducts(filters, 1);
    loadCategories();
  }, []);

  const handleSearch = (search) => {
    const updatedFilters = {
      ...filters,
      search,
    };

    setFilters(updatedFilters);
    setPage(1);
    loadProducts(updatedFilters, 1);
  };

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCategory = (category) => {
    const updatedFilters = {
      ...filters,
      category,
    };

    setFilters(updatedFilters);
    setPage(1);
    loadProducts(updatedFilters, 1);
  };

  const applyFilters = () => {
    setShowFilters(false);
    setPage(1);
    loadProducts(filters, 1);
  };

  const clearFilters = () => {
    const resetFilters = {
      search: "",
      category: "",
      size: "",
      color: "",
      minPrice: "",
      maxPrice: "",
    };

    setFilters(resetFilters);
    setShowFilters(false);
    setPage(1);
    loadProducts(resetFilters, 1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;

    setPage(newPage);
    loadProducts(filters, newPage);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const hasFilters =
    filters.search ||
    filters.category ||
    filters.size ||
    filters.color ||
    filters.minPrice ||
    filters.maxPrice;

  return (
    <main className="bg-white">
      <section className="border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-950">
            T-Shirts
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="mb-7">
          <SearchBar
            onSearch={handleSearch}
          />
        </div>

        {categories.length > 0 && (
          <div className="mb-7 overflow-x-auto">
            <div className="flex min-w-max gap-6 border-b border-gray-200">
              <button
                type="button"
                onClick={() =>
                  handleCategory("")
                }
                className={`pb-3 text-sm ${
                  filters.category === ""
                    ? "border-b-2 border-black font-medium text-black"
                    : "text-gray-500 hover:text-black"
                }`}
              >
                All
              </button>

              {categories.map(
                (category) => (
                  <button
                    key={category._id}
                    type="button"
                    onClick={() =>
                      handleCategory(
                        category.name
                      )
                    }
                    className={`pb-3 text-sm ${
                      filters.category ===
                      category.name
                        ? "border-b-2 border-black font-medium text-black"
                        : "text-gray-500 hover:text-black"
                    }`}
                  >
                    {category.name}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        <div className="mb-7 flex justify-end">
          <button
            type="button"
            onClick={() =>
              setShowFilters(
                (current) => !current
              )
            }
            className="border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:border-black hover:text-black lg:hidden"
          >
            {showFilters
              ? "Hide filters"
              : "Filters"}
          </button>
        </div>

        <div
          className={`mb-8 ${
            showFilters
              ? "block"
              : "hidden lg:block"
          }`}
        >
          <div className="border-y border-gray-200 py-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label
                  htmlFor="size"
                  className="mb-2 block text-xs font-medium text-gray-600"
                >
                  Size
                </label>

                <select
                  id="size"
                  name="size"
                  value={filters.size}
                  onChange={handleChange}
                  className="h-10 w-full border border-gray-300 bg-white px-3 text-sm outline-none focus:border-black"
                >
                  <option value="">
                    All sizes
                  </option>

                  <option value="XS">
                    XS
                  </option>

                  <option value="S">
                    S
                  </option>

                  <option value="M">
                    M
                  </option>

                  <option value="L">
                    L
                  </option>

                  <option value="XL">
                    XL
                  </option>

                  <option value="XXL">
                    XXL
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="color"
                  className="mb-2 block text-xs font-medium text-gray-600"
                >
                  Color
                </label>

                <select
                  id="color"
                  name="color"
                  value={filters.color}
                  onChange={handleChange}
                  className="h-10 w-full border border-gray-300 bg-white px-3 text-sm outline-none focus:border-black"
                >
                  <option value="">
                    All colors
                  </option>

                  {colorOptions.map(
                    (color) => (
                      <option
                        key={color}
                        value={color}
                      >
                        {color}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="minPrice"
                  className="mb-2 block text-xs font-medium text-gray-600"
                >
                  Min price
                </label>

                <input
                  id="minPrice"
                  type="number"
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={handleChange}
                  placeholder="₹ Min"
                  min="0"
                  className="h-10 w-full border border-gray-300 px-3 text-sm outline-none placeholder:text-gray-400 focus:border-black"
                />
              </div>

              <div>
                <label
                  htmlFor="maxPrice"
                  className="mb-2 block text-xs font-medium text-gray-600"
                >
                  Max price
                </label>

                <input
                  id="maxPrice"
                  type="number"
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={handleChange}
                  placeholder="₹ Max"
                  min="0"
                  className="h-10 w-full border border-gray-300 px-3 text-sm outline-none placeholder:text-gray-400 focus:border-black"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={applyFilters}
                  className="h-10 flex-1 bg-black px-4 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Apply
                </button>

                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="h-10 border border-gray-300 px-4 text-sm text-gray-700 hover:border-black hover:text-black"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="py-12">
            <Loader text="Loading products..." />
          </div>
        )}

        {!loading && error && (
          <div className="py-14 text-center">
            <p className="text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                loadProducts(filters)
              }
              className="mt-4 bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Try again
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          products.length === 0 && (
            <div className="py-16 text-center">
              <h2 className="text-lg font-medium text-gray-900">
                No products found
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Try changing your search
                or filters.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 border border-black px-5 py-2.5 text-sm font-medium hover:bg-black hover:text-white"
              >
                Clear filters
              </button>
            </div>
          )}

        {!loading &&
          !error &&
          products.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
                {products.map(
                  (product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                    />
                  )
                )}
              </div>

              {totalPages > 1 && (
                <div className="mt-14 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                    className="border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-300 disabled:hover:text-gray-700"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, index) => {
                    const pageNum = index + 1;
                    const isCurrent = pageNum === page;

                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`h-9 w-9 border text-sm font-medium transition ${
                          isCurrent
                            ? "border-black bg-black text-white"
                            : "border-gray-300 text-gray-700 hover:border-black hover:text-black"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-300 disabled:hover:text-gray-700"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
      </section>
    </main>
  );
};

export default Products;