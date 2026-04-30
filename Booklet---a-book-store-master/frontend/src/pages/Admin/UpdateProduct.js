import React, { useEffect, useMemo, useRef, useState } from "react";
import Layout from "./../../components/Layout/Layout";
import AdminMenu from "./../../components/Layout/AdminMenu";
import toast from "react-hot-toast";
import axios from "../../config/axios";
import { useNavigate, useParams } from "react-router-dom";
import { getApiErrorMessage } from "../../utils/errorUtils";
import { useConfirm } from "../../context/confirm";
import {
  FiEdit3,
  FiFileText,
  FiHash,
  FiImage,
  FiLink,
  FiMapPin,
  FiSave,
  FiTag,
  FiTrash2,
  FiTruck,
  FiUpload,
} from "react-icons/fi";

const FALLBACK_IMAGE = "https://placehold.co/600x400/f5f0e8/826b4d?text=No+Image";

const UpdateProduct = () => {
  const navigate = useNavigate();
  const params = useParams();
  const confirm = useConfirm();
  const fileInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [shipping, setShipping] = useState("0");
  const [shippingCharge, setShippingCharge] = useState("0");
  const [estimatedDeliveryMinDays, setEstimatedDeliveryMinDays] = useState("2");
  const [estimatedDeliveryMaxDays, setEstimatedDeliveryMaxDays] = useState("5");
  const [returnWindowDays, setReturnWindowDays] = useState("7");
  const [priceIncludesTax, setPriceIncludesTax] = useState("1");
  const [taxRate, setTaxRate] = useState("0");
  const [sku, setSku] = useState("");
  const [isbn, setIsbn] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [language, setLanguage] = useState("English");
  const [format, setFormat] = useState("Paperback");
  const [edition, setEdition] = useState("");
  const [pages, setPages] = useState("");
  const [weightInGrams, setWeightInGrams] = useState("");
  const [highlights, setHighlights] = useState("");
  const [perfectFor, setPerfectFor] = useState("");
  const [detailsAndCare, setDetailsAndCare] = useState("");
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);

  const [imageInputMode, setImageInputMode] = useState("url");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageUrls, setImageUrls] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [selectedServiceLocations, setSelectedServiceLocations] = useState(["all"]);

  const activeImageUrls = useMemo(
    () =>
      imageInputMode === "url"
        ? imageUrls
        : uploadedImages.map((item) => item.dataUrl),
    [imageInputMode, imageUrls, uploadedImages]
  );

  const getFinalImageUrls = () => {
    const uploadUrls = uploadedImages.map((item) => item.dataUrl);

    const candidateUrls =
      imageInputMode === "upload"
        ? uploadUrls.length
          ? uploadUrls
          : imageUrls
        : imageUrls.length
          ? imageUrls
          : uploadUrls;

    return Array.from(new Set(candidateUrls.map((url) => url.trim()).filter(Boolean)));
  };

  const getSingleProduct = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/v1/product/get-product/${params.slug}`);
      const product = data?.product;
      if (!product) return;

      setName(product.name || "");
      setId(product._id || "");
      setDescription(product.description || "");
      setPrice(product.price ?? "");
      setMrp(product.mrp ?? "");
      setQuantity(product.quantity ?? "");
      setShipping(String(product.shipping === true || String(product.shipping) === "1" ? "1" : "0"));
      setShippingCharge(product.shippingCharge ?? "0");
      setEstimatedDeliveryMinDays(product.estimatedDeliveryMinDays ?? "2");
      setEstimatedDeliveryMaxDays(product.estimatedDeliveryMaxDays ?? "5");
      setReturnWindowDays(product.returnWindowDays ?? "7");
      setPriceIncludesTax(
        String(
          product.priceIncludesTax === true || String(product.priceIncludesTax) === "1"
            ? "1"
            : "0"
        )
      );
      setTaxRate(product.taxRate ?? "0");
      setSku(product.sku || "");
      setIsbn(product.isbn || "");
      setAuthor(product.author || "");
      setPublisher(product.publisher || "");
      setLanguage(product.language || "English");
      setFormat(product.format || "Paperback");
      setEdition(product.edition || "");
      setPages(product.pages ?? "");
      setWeightInGrams(product.weightInGrams ?? "");
      setHighlights(
        Array.isArray(product.highlights) ? product.highlights.join("\n") : ""
      );
      setPerfectFor(
        Array.isArray(product.perfectFor) ? product.perfectFor.join("\n") : ""
      );
      setDetailsAndCare(
        Array.isArray(product.detailsAndCare) ? product.detailsAndCare.join("\n") : ""
      );
      setCategory(product?.category?._id || "");

      const serverImageUrls = Array.isArray(product.imageUrls)
        ? product.imageUrls.filter(Boolean)
        : [];
      const normalized = serverImageUrls.length
        ? serverImageUrls
        : product.imageUrl
          ? [product.imageUrl]
          : [];

      const normalizedLocations = Array.isArray(product.serviceLocations)
        ? product.serviceLocations
            .map((item) => String(item || "").trim().toLowerCase())
            .filter(Boolean)
        : [];
      setSelectedServiceLocations(
        normalizedLocations.length ? normalizedLocations : ["all"]
      );

      setImageUrls(normalized);
      setUploadedImages([]);
      setImageInputMode("url");
      setImageUrlInput("");
    } catch (error) {
      console.log(error);
      toast.error("Unable to load product details");
    } finally {
      setLoading(false);
    }
  };

  const getAllCategory = async () => {
    try {
      const { data } = await axios.get("/api/v1/category/get-category");
      if (data?.success) setCategories(data?.category || []);
    } catch (error) {
      console.log(error);
      toast.error(getApiErrorMessage(error, "Unable to load categories"));
    }
  };

  const getServiceAreas = async () => {
    try {
      const { data } = await axios.get("/api/v1/location/service-areas");
      setServiceAreas(Array.isArray(data?.serviceAreas) ? data.serviceAreas : []);
    } catch (error) {
      console.log(error);
      toast.error("Unable to load service areas");
    }
  };

  useEffect(() => {
    getSingleProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.slug]);

  useEffect(() => {
    getAllCategory();
    getServiceAreas();
  }, []);

  const addImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) {
      toast.error("Please enter an image URL");
      return;
    }

    const isValidUrl = /^(https?:\/\/|data:image\/)/i.test(trimmed);
    if (!isValidUrl) {
      toast.error("Please enter a valid image URL");
      return;
    }

    setImageUrls((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setImageUrlInput("");
  };

  const removeImageUrl = (urlToRemove) => {
    setImageUrls((prev) => prev.filter((url) => url !== urlToRemove));
  };

  const clearImageUrls = () => {
    setImageUrls([]);
    setImageUrlInput("");
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles = [];
    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not a valid image file`);
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 2MB limit`);
        return;
      }
      validFiles.push(file);
    });

    if (!validFiles.length) {
      e.target.value = "";
      return;
    }

    const readFileAsDataUrl = (file) =>
      new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(
            typeof reader.result === "string"
              ? {
                  name: file.name,
                  dataUrl: reader.result,
                }
              : null
          );
        };
        reader.readAsDataURL(file);
      });

    const fileData = (await Promise.all(validFiles.map(readFileAsDataUrl))).filter(Boolean);

    setUploadedImages((prev) => {
      const merged = [...prev, ...fileData];
      return merged.filter(
        (item, index, self) =>
          index === self.findIndex((entry) => entry.dataUrl === item.dataUrl)
      );
    });

    e.target.value = "";
  };

  const clearUploadedImages = () => {
    setUploadedImages([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeUploadedImage = (dataUrl) => {
    setUploadedImages((prev) => prev.filter((item) => item.dataUrl !== dataUrl));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!name || !description || !price || !quantity || !category) {
      toast.error("Please fill all required fields");
      return;
    }

    const finalImageUrls = getFinalImageUrls();

    try {
      const productData = {
        name,
        description,
        price,
        mrp,
        quantity,
        category,
        shipping: shipping === "1",
        shippingCharge,
        estimatedDeliveryMinDays,
        estimatedDeliveryMaxDays,
        returnWindowDays,
        priceIncludesTax: priceIncludesTax === "1",
        taxRate,
        sku,
        isbn,
        author,
        publisher,
        language,
        format,
        edition,
        pages,
        weightInGrams,
        highlights: highlights
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        perfectFor: perfectFor
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        detailsAndCare: detailsAndCare
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        imageUrl: finalImageUrls[0] || "",
        imageUrls: finalImageUrls,
        serviceLocations: selectedServiceLocations,
      };

      const { data } = await axios.put(`/api/v1/product/update-product/${id}`, productData);
      if (data?.success) {
        toast.success(data?.message || "Product updated successfully");
        navigate("/dashboard/admin/products");
      } else {
        toast.error(data?.message || "Unable to update product");
      }
    } catch (error) {
      console.log(error);
      toast.error(getApiErrorMessage(error, "Unable to update product"));
    }
  };

  const toggleServiceLocation = (locationId) => {
    if (!locationId) return;

    if (locationId === "all") {
      setSelectedServiceLocations(["all"]);
      return;
    }

    setSelectedServiceLocations((prev) => {
      const withoutAll = prev.filter((id) => id !== "all");
      if (withoutAll.includes(locationId)) {
        const next = withoutAll.filter((id) => id !== locationId);
        return next.length ? next : ["all"];
      }
      return [...withoutAll, locationId];
    });
  };

  const handleDelete = async () => {
    try {
      const answer = await confirm({
        title: "Delete product permanently?",
        message: `Delete "${name || "this product"}"? This action cannot be undone.`,
        confirmText: "Delete Product",
        cancelText: "Cancel",
        tone: "danger",
      });
      if (!answer) return;

      await axios.delete(`/api/v1/product/delete-product/${id}`);
      toast.success("Product deleted successfully");
      navigate("/dashboard/admin/products");
    } catch (error) {
      console.log(error);
      toast.error(getApiErrorMessage(error, "Unable to delete product"));
    }
  };

  const showPreview = activeImageUrls.length > 0;

  return (
    <Layout title={"Admin - Update Product"}>
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6 lg:h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-5 lg:gap-6 items-start lg:h-full">
          <div>
            <AdminMenu />
          </div>

          <div className="min-w-0 lg:h-full lg:overflow-y-auto lg:pr-1 space-y-5">
            <div className="rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50 via-white to-accent-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-white text-accent-700 flex items-center justify-center border border-accent-200 shadow-sm">
                  <FiEdit3 className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-primary-900">Update Product</h1>
                  <p className="text-sm text-primary-600">
                    Edit details, manage product images, and keep your catalog up to date.
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleUpdate}
              className="rounded-2xl border border-primary-200 bg-white p-4 sm:p-5 shadow-sm space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-500 inline-flex items-center gap-1.5">
                    <FiTag className="h-3.5 w-3.5" />
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 rounded-lg border border-primary-200 bg-white px-3 text-sm text-primary-900 focus:outline-none focus:ring-2 focus:ring-accent-300"
                  >
                    <option value="">Select category</option>
                    {categories?.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-500 inline-flex items-center gap-1.5">
                    <FiTruck className="h-3.5 w-3.5" />
                    Shipping Available
                  </label>
                  <select
                    value={shipping}
                    onChange={(e) => setShipping(e.target.value)}
                    className="w-full h-10 rounded-lg border border-primary-200 bg-white px-3 text-sm text-primary-900 focus:outline-none focus:ring-2 focus:ring-accent-300"
                  >
                    <option value="0">No</option>
                    <option value="1">Yes</option>
                  </select>
                </div>
              </div>

              <div className="rounded-lg border border-primary-200 bg-primary-50/60 p-3">
                <label className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary-500 inline-flex items-center gap-1.5">
                  <FiMapPin className="h-3.5 w-3.5" />
                  Service Locations
                </label>
                <p className="text-xs text-primary-600 mb-2.5">
                  Choose where this book can be delivered.
                </p>
                {serviceAreas.length === 0 && (
                  <p className="text-xs text-red-600 mb-2.5">
                    No active service location found. Add one from Service
                    Locations page.
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleServiceLocation("all")}
                    className={`h-8 px-3 rounded-full border text-xs font-semibold ${
                      selectedServiceLocations.includes("all")
                        ? "border-accent-300 bg-accent-100 text-accent-700"
                        : "border-primary-200 bg-white text-primary-700 hover:bg-primary-50"
                    }`}
                  >
                    All Serviceable Areas
                  </button>
                  {serviceAreas.map((area) => (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => toggleServiceLocation(area.id)}
                      className={`h-8 px-3 rounded-full border text-xs font-semibold ${
                        selectedServiceLocations.includes(area.id)
                          ? "border-accent-300 bg-accent-100 text-accent-700"
                          : "border-primary-200 bg-white text-primary-700 hover:bg-primary-50"
                      }`}
                    >
                      {area.label}
                      {area.pincode ? ` (${area.pincode})` : ""}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-500">
                  Product Name
                </label>
                <input
                  type="text"
                  value={name}
                  placeholder="Enter product name"
                  className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-500 inline-flex items-center gap-1.5">
                  <FiFileText className="h-3.5 w-3.5" />
                  Description
                </label>
                <textarea
                  value={description}
                  placeholder="Enter product description"
                  className="w-full min-h-[110px] rounded-lg border border-primary-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-500 inline-flex items-center gap-1.5">
                    <span className="text-sm leading-none">₹</span>
                    Selling Price (INR)
                  </label>
                  <input
                    type="number"
                    value={price}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-500">
                    MRP (INR)
                  </label>
                  <input
                    type="number"
                    value={mrp}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    onChange={(e) => setMrp(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-500 inline-flex items-center gap-1.5">
                    <FiHash className="h-3.5 w-3.5" />
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    placeholder="0"
                    className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Price Includes Tax
                  </label>
                  <select
                    value={priceIncludesTax}
                    onChange={(e) => setPriceIncludesTax(e.target.value)}
                    className="w-full h-10 rounded-lg border border-primary-200 bg-white px-3 text-sm text-primary-900 focus:outline-none focus:ring-2 focus:ring-accent-300"
                  >
                    <option value="1">Yes</option>
                    <option value="0">No</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    value={taxRate}
                    placeholder="0"
                    step="0.01"
                    className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    onChange={(e) => setTaxRate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Shipping Charge (INR)
                  </label>
                  <input
                    type="number"
                    value={shippingCharge}
                    placeholder="0"
                    step="0.01"
                    className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    onChange={(e) => setShippingCharge(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Delivery Min Days
                  </label>
                  <input
                    type="number"
                    value={estimatedDeliveryMinDays}
                    placeholder="2"
                    className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    onChange={(e) => setEstimatedDeliveryMinDays(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Delivery Max Days
                  </label>
                  <input
                    type="number"
                    value={estimatedDeliveryMaxDays}
                    placeholder="5"
                    className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    onChange={(e) => setEstimatedDeliveryMaxDays(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Return Window (Days)
                  </label>
                  <input
                    type="number"
                    value={returnWindowDays}
                    placeholder="7"
                    className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    onChange={(e) => setReturnWindowDays(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-500">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={sku}
                    placeholder="SKU-001"
                    className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    onChange={(e) => setSku(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-500">
                    ISBN
                  </label>
                  <input
                    type="text"
                    value={isbn}
                    placeholder="978..."
                    className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    onChange={(e) => setIsbn(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Author
                  </label>
                  <input
                    type="text"
                    value={author}
                    placeholder="Author name"
                    className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    onChange={(e) => setAuthor(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Publisher
                  </label>
                  <input
                    type="text"
                    value={publisher}
                    placeholder="Publisher"
                    className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    onChange={(e) => setPublisher(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Language
                  </label>
                  <input
                    type="text"
                    value={language}
                    placeholder="English"
                    className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    onChange={(e) => setLanguage(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Format
                  </label>
                  <input
                    type="text"
                    value={format}
                    placeholder="Paperback"
                    className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    onChange={(e) => setFormat(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Edition
                  </label>
                  <input
                    type="text"
                    value={edition}
                    placeholder="1st Edition"
                    className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    onChange={(e) => setEdition(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Pages
                  </label>
                  <input
                    type="number"
                    value={pages}
                    placeholder="0"
                    className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    onChange={(e) => setPages(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Weight (Grams)
                  </label>
                  <input
                    type="number"
                    value={weightInGrams}
                    placeholder="0"
                    className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    onChange={(e) => setWeightInGrams(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Perfect For (One per line)
                  </label>
                  <textarea
                    value={perfectFor}
                    placeholder={"Students\nExam prep\nDaily practice"}
                    className="w-full min-h-[90px] rounded-lg border border-primary-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    onChange={(e) => setPerfectFor(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Highlights (One per line)
                  </label>
                  <textarea
                    value={highlights}
                    placeholder={"Premium quality print\nEasy returns\nFast dispatch"}
                    className="w-full min-h-[90px] rounded-lg border border-primary-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    onChange={(e) => setHighlights(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Reading & Handling Notes (One per line)
                  </label>
                  <textarea
                    value={detailsAndCare}
                    placeholder={"Reading level: Class XI\nKeep away from moisture\nStore upright on shelf"}
                    className="w-full min-h-[90px] rounded-lg border border-primary-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    onChange={(e) => setDetailsAndCare(e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-primary-200 bg-primary-50/60 p-3">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wide text-primary-500 inline-flex items-center gap-1.5">
                    <FiImage className="h-3.5 w-3.5" />
                    Product Images
                  </label>
                  <div className="inline-flex rounded-lg border border-primary-200 bg-white p-1">
                    <button
                      type="button"
                      onClick={() => setImageInputMode("url")}
                      className={`h-8 px-3 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 ${
                        imageInputMode === "url"
                          ? "bg-accent-100 text-accent-700"
                          : "text-primary-600 hover:bg-primary-50"
                      }`}
                    >
                      <FiLink className="h-3.5 w-3.5" />
                      Image URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode("upload")}
                      className={`h-8 px-3 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 ${
                        imageInputMode === "upload"
                          ? "bg-accent-100 text-accent-700"
                          : "text-primary-600 hover:bg-primary-50"
                      }`}
                    >
                      <FiUpload className="h-3.5 w-3.5" />
                      Upload
                    </button>
                  </div>
                </div>

                {imageInputMode === "url" ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={imageUrlInput}
                        placeholder="Paste image URL and click Add"
                        className="flex-1 h-10 rounded-lg border border-primary-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addImageUrl();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={addImageUrl}
                        className="h-10 px-3 rounded-md border border-accent-200 bg-accent-50 text-accent-700 hover:bg-accent-100 text-xs font-semibold"
                      >
                        Add URL
                      </button>
                    </div>

                    {imageUrls.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {imageUrls.map((url) => (
                          <span
                            key={url}
                            className="inline-flex items-center gap-1 rounded-md border border-primary-200 bg-white px-2 py-1 text-xs text-primary-700"
                          >
                            <span className="max-w-[220px] truncate">{url}</span>
                            <button
                              type="button"
                              className="text-red-600 hover:text-red-700 font-bold"
                              onClick={() => removeImageUrl(url)}
                              aria-label={`Remove ${url}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-primary-500">Added URLs: {imageUrls.length}</p>
                      {imageUrls.length > 0 && (
                        <button
                          type="button"
                          onClick={clearImageUrls}
                          className="h-7 px-2.5 rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold"
                        >
                          Remove All URLs
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <div className="w-full min-h-[40px] rounded-lg border border-primary-200 bg-white px-3 py-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-7 px-3 rounded-md border border-accent-200 bg-accent-50 text-accent-700 hover:bg-accent-100 text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <FiUpload className="h-3.5 w-3.5" />
                        Choose Files
                      </button>
                      <span className="text-sm text-primary-600">
                        {uploadedImages.length
                          ? `${uploadedImages.length} file${uploadedImages.length > 1 ? "s" : ""} selected`
                          : "No file chosen"}
                      </span>
                      {uploadedImages.length > 0 && (
                        <button
                          type="button"
                          onClick={clearUploadedImages}
                          className="ml-auto h-7 px-2.5 rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold"
                        >
                          Remove All
                        </button>
                      )}
                    </div>

                    {uploadedImages.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {uploadedImages.map((file) => (
                          <span
                            key={file.dataUrl}
                            className="inline-flex items-center gap-1 rounded-md border border-primary-200 bg-white px-2 py-1 text-xs text-primary-700"
                          >
                            <span className="max-w-[180px] truncate">{file.name}</span>
                            <button
                              type="button"
                              className="text-red-600 hover:text-red-700 font-bold"
                              onClick={() => removeUploadedImage(file.dataUrl)}
                              aria-label={`Remove ${file.name}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-primary-500">Supported: JPG, PNG, WEBP. Max size: 2MB.</p>
                  </div>
                )}
              </div>

              {showPreview && (
                <div className="rounded-lg border border-primary-200 p-2 bg-primary-50">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-500 mb-2">
                    Image Preview ({activeImageUrls.length})
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {activeImageUrls.map((url, index) => (
                      <div
                        key={`${url}-${index}`}
                        className="rounded-md border border-primary-200 overflow-hidden bg-white"
                      >
                        <img
                          src={url || FALLBACK_IMAGE}
                          alt={`product preview ${index + 1}`}
                          className="h-[120px] w-full object-contain p-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-1 flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="h-10 px-4 rounded-lg bg-accent-500 hover:bg-accent-600 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2"
                >
                  <FiSave className="h-4 w-4" />
                  {loading ? "Saving..." : "Update Product"}
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="h-10 px-4 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-semibold inline-flex items-center gap-2"
                >
                  <FiTrash2 className="h-4 w-4" />
                  Delete Product
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UpdateProduct;
