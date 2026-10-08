"use client";

import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
} from "react";
import { useParams, useRouter } from "next/navigation";

type Campaign = {
  id: number;
  title: string;
  slug: string;
  summary: string;
  story: string;
  coverImage: string | null;
  goalAmount: number | null;
  raisedAmount: number | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  order: number;
  photos?: CampaignPhotoItem[];
  videos?: CampaignVideoItem[];
};

type CampaignPhotoItem = {
  id: number;
  image: string;
  caption: string | null;
  order: number;
};

type CampaignVideoItem = {
  id: number;
  videoUrl: string;
  title: string | null;
  order: number;
};

type ProductItem = {
  id?: number;
  name: string;
  availableQty: number;
  pricePerUnit: number;
  image: string | null;
  order: number;
  isActive: boolean;
};

type CampaignUpdateItem = {
  id: number;
  title: string;
  description: string;
  images: string[];
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
};

type TabName = "story" | "products" | "project" | "updates";

export default function CampaignEditPage() {
  const params = useParams();
  const router = useRouter();

  const campaignId = String(params.id || "");

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [updates, setUpdates] = useState<CampaignUpdateItem[]>([]);

  const [activeTab, setActiveTab] = useState<TabName>("story");

  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [savingProducts, setSavingProducts] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [addingUpdate, setAddingUpdate] = useState(false);
  const [uploadingProductIndex, setUploadingProductIndex] = useState<number | null>(null);

  const [storyText, setStoryText] = useState("");
  const [savingStory, setSavingStory] = useState(false);
  const [uploadingGalleryPhoto, setUploadingGalleryPhoto] = useState(false);
  const [deletingGalleryPhotoId, setDeletingGalleryPhotoId] = useState<number | null>(null);
  const [galleryVideoTitle, setGalleryVideoTitle] = useState("");
  const [galleryVideoUrl, setGalleryVideoUrl] = useState("");
  const [addingGalleryVideo, setAddingGalleryVideo] = useState(false);
  const [deletingGalleryVideoId, setDeletingGalleryVideoId] = useState<number | null>(null);

  const [message, setMessage] = useState("");

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  const [title, setTitle] = useState("");
  const [organizerName, setOrganizerName] = useState("WIN Foundations");
  const [overlayText, setOverlayText] = useState("");
  const [taxBenefitEligible, setTaxBenefitEligible] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState(true);

  const [videoUrl, setVideoUrl] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectImageUrls, setProjectImageUrls] = useState<string[]>([]);
  const [newProjectImageUrl, setNewProjectImageUrl] = useState("");

  const [updateTitle, setUpdateTitle] = useState("");
  const [updateDescription, setUpdateDescription] = useState("");
  const [updateImageUrls, setUpdateImageUrls] = useState<string[]>([]);
  const [newUpdateImageUrl, setNewUpdateImageUrl] = useState("");

  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedProjectFile, setSelectedProjectFile] = useState("");
  const [selectedUpdateFiles, setSelectedUpdateFiles] = useState<string[]>([]);
  const [productsExpanded, setProductsExpanded] = useState(true);
  const [campaignImagePreviews, setCampaignImagePreviews] = useState<string[]>([]);

  const redirectToLogin = useCallback(() => {
    router.push("/admin/login");
  }, [router]);

  const getToken = useCallback(async () => {
    return "cookie-auth";
  }, []);

  const loadCampaign = useCallback(async () => {
    if (!campaignId) {
      setMessage("Campaign ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/campaigns", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to fetch campaign");
      }

      const found = Array.isArray(data)
        ? data.find((item: Campaign) => String(item.id) === campaignId)
        : null;

      if (!found) {
        throw new Error("Campaign not found.");
      }

      setCampaign(found);
      setTitle(found.title);
      setActiveCampaign(found.isActive);
      setStoryText(found.story || "");
    } catch (error) {
      console.error("Load campaign error:", error);
      setMessage(
        error instanceof Error ? error.message : "Failed to load campaign."
      );
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  const loadProducts = useCallback(async () => {
    if (!campaignId) return;

    try {
      setLoadingProducts(true);

      const response = await fetch(
        `/api/campaign-products?campaignId=${encodeURIComponent(campaignId)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to load campaign products");
      }

      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load products error:", error);

      // Keep the Products tab usable even if the endpoint is not ready yet.
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [campaignId]);

  const loadProject = useCallback(async () => {
    if (!campaignId) return;

    try {
      const response = await fetch(
        `/api/campaign-project?campaignId=${encodeURIComponent(campaignId)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        setVideoUrl("");
        setProjectDescription("");
        setProjectImageUrls([]);
        return;
      }

      const data = await response.json();

      if (!data) {
        setVideoUrl("");
        setProjectDescription("");
        setProjectImageUrls([]);
        return;
      }

      setVideoUrl(typeof data.videoUrl === "string" ? data.videoUrl : "");
      setProjectDescription(
        typeof data.description === "string" ? data.description : ""
      );

      if (Array.isArray(data.images)) {
        setProjectImageUrls(data.images.map(String));
      } else if (typeof data.images === "string" && data.images.trim()) {
        try {
          const parsed = JSON.parse(data.images);
          setProjectImageUrls(
            Array.isArray(parsed)
              ? parsed.map(String)
              : data.images
                  .split(",")
                  .map((value: string) => value.trim())
                  .filter(Boolean)
          );
        } catch {
          setProjectImageUrls(
            data.images
              .split(",")
              .map((value: string) => value.trim())
              .filter(Boolean)
          );
        }
      } else {
        setProjectImageUrls([]);
      }
    } catch (error) {
      console.error("Load project error:", error);
    }
  }, [campaignId]);

  const loadUpdates = useCallback(async () => {
    if (!campaignId) return;

    try {
      setLoadingUpdates(true);

      const response = await fetch(
        `/api/campaign-updates?campaignId=${encodeURIComponent(campaignId)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        setUpdates([]);
        return;
      }

      const data = await response.json();

      setUpdates(
        Array.isArray(data)
          ? data.map((item: Record<string, unknown>) => ({
              id: Number(item.id),
              title: String(item.title || "Campaign Update"),
              description: String(item.description || ""),
              images: Array.isArray(item.images)
                ? item.images.map(String)
                : typeof item.images === "string" && item.images.trim()
                  ? (() => {
                      try {
                        const parsed = JSON.parse(item.images as string);
                        return Array.isArray(parsed)
                          ? parsed.map(String)
                          : (item.images as string)
                              .split(",")
                              .map((value: string) => value.trim())
                              .filter(Boolean);
                      } catch {
                        return (item.images as string)
                          .split(",")
                          .map((value: string) => value.trim())
                          .filter(Boolean);
                      }
                    })()
                  : [],
              isPublished: Boolean(item.isPublished),
              publishedAt:
                typeof item.publishedAt === "string"
                  ? item.publishedAt
                  : null,
              createdAt:
                typeof item.createdAt === "string"
                  ? item.createdAt
                  : "",
            }))
          : []
      );
    } catch (error) {
      console.error("Load updates error:", error);
      setUpdates([]);
    } finally {
      setLoadingUpdates(false);
    }
  }, [campaignId]);

  useEffect(() => {
    void loadCampaign();
    void loadProducts();
    void loadProject();
    void loadUpdates();
  }, [
    loadCampaign,
    loadProducts,
    loadProject,
    loadUpdates,
  ]);

  async function saveStoryTab() {
    const token = await getToken();

    if (!token) return;

    try {
      setSavingStory(true);
      setMessage("");

      const response = await fetch("/api/campaigns", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: campaignId,
          title: campaign?.title || title.trim() || "Campaign",
          slug: campaign?.slug || "",
          summary: campaign?.summary || "",
          story: storyText,
          coverImage: campaign?.coverImage || imageUrls[0] || null,
          goalAmount: campaign?.goalAmount ?? null,
          raisedAmount: campaign?.raisedAmount ?? null,
          startDate: campaign?.startDate || null,
          endDate: campaign?.endDate || null,
          isActive: activeCampaign,
          order: campaign?.order ?? 0,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to save campaign story.");
      }

      setCampaign((current) => (current ? { ...current, story: storyText } : current));
      setMessage("Campaign story saved.");
    } catch (error) {
      console.error("Save story error:", error);
      setMessage(error instanceof Error ? error.message : "Failed to save campaign story.");
    } finally {
      setSavingStory(false);
    }
  }

  async function uploadGalleryPhoto(file: File) {
    if (!file.type.startsWith("image/")) {
      setMessage("Please choose an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage("Image must be smaller than 10MB.");
      return;
    }

    try {
      setUploadingGalleryPhoto(true);
      setMessage("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("campaignId", campaignId);

      const response = await fetch("/api/campaigns/photos", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to upload photo");
      }

      setCampaign((current) =>
        current ? { ...current, photos: [...(current.photos || []), data] } : current
      );
    } catch (error) {
      console.error("Gallery photo upload error:", error);
      setMessage(error instanceof Error ? error.message : "Failed to upload photo.");
    } finally {
      setUploadingGalleryPhoto(false);
    }
  }

  async function deleteGalleryPhoto(photo: CampaignPhotoItem) {
    const confirmed = window.confirm("Remove this photo from the gallery?");
    if (!confirmed) return;

    try {
      setDeletingGalleryPhotoId(photo.id);

      const response = await fetch("/api/campaigns/photos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: photo.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to delete photo");
      }

      setCampaign((current) =>
        current ? { ...current, photos: (current.photos || []).filter((p) => p.id !== photo.id) } : current
      );
    } catch (error) {
      console.error("Delete gallery photo error:", error);
      setMessage(error instanceof Error ? error.message : "Failed to delete photo.");
    } finally {
      setDeletingGalleryPhotoId(null);
    }
  }

  async function addGalleryVideo() {
    if (!galleryVideoTitle.trim() || !galleryVideoUrl.trim()) {
      setMessage("Video title and URL are required.");
      return;
    }

    try {
      setAddingGalleryVideo(true);
      setMessage("");

      const response = await fetch("/api/campaigns/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          title: galleryVideoTitle.trim(),
          videoUrl: galleryVideoUrl.trim(),
          order: campaign?.videos?.length ?? 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to add video");
      }

      setCampaign((current) =>
        current ? { ...current, videos: [...(current.videos || []), data] } : current
      );
      setGalleryVideoTitle("");
      setGalleryVideoUrl("");
    } catch (error) {
      console.error("Add gallery video error:", error);
      setMessage(error instanceof Error ? error.message : "Failed to add video.");
    } finally {
      setAddingGalleryVideo(false);
    }
  }

  async function deleteGalleryVideo(video: CampaignVideoItem) {
    const confirmed = window.confirm(`Remove video "${video.title || video.videoUrl}"?`);
    if (!confirmed) return;

    try {
      setDeletingGalleryVideoId(video.id);

      const response = await fetch("/api/campaigns/videos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: video.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to delete video");
      }

      setCampaign((current) =>
        current ? { ...current, videos: (current.videos || []).filter((v) => v.id !== video.id) } : current
      );
    } catch (error) {
      console.error("Delete gallery video error:", error);
      setMessage(error instanceof Error ? error.message : "Failed to delete video.");
    } finally {
      setDeletingGalleryVideoId(null);
    }
  }

  const amountCollected = campaign?.raisedAmount ?? 0;

  const productTotalAmount = products.reduce(
    (total, product) =>
      total +
      Math.max(0, Number(product.availableQty) || 0) *
        Math.max(0, Number(product.pricePerUnit) || 0),
    0
  );

  const goalForDisplay =
    productTotalAmount > 0
      ? productTotalAmount
      : campaign?.goalAmount ?? 0;

  const amountNeeded = Math.max(
    0,
    goalForDisplay - amountCollected
  );

  const percentage =
    goalForDisplay <= 0
      ? 0
      : Math.min(
          100,
          Math.round((amountCollected / goalForDisplay) * 100)
        );
  function addImageUrl() {
    const value = newImageUrl.trim();

    if (!value) return;

    setImageUrls((current) => [...current, value]);
    setNewImageUrl("");
  }

  function removeImageUrl(index: number) {
    setImageUrls((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  function addProjectImageUrl() {
    const value = newProjectImageUrl.trim();

    if (!value) return;

    setProjectImageUrls((current) => [...current, value]);
    setNewProjectImageUrl("");
  }

  function addUpdateImageUrl() {
    const value = newUpdateImageUrl.trim();

    if (!value) return;

    setUpdateImageUrls((current) => [...current, value]);
    setNewUpdateImageUrl("");
  }

  function handleFiles(
    files: FileList | null,
    type: "products" | "project" | "updates"
  ) {
    if (!files) return;

    const names = Array.from(files).map((file) => file.name);

    if (type === "products") {
      setSelectedFiles(names);

      const readers = Array.from(files).map(
        (file) =>
          new Promise<string>((resolve) => {
            if (!file.type.startsWith("image/")) {
              resolve("");
              return;
            }

            const reader = new FileReader();
            reader.onload = () =>
              resolve(typeof reader.result === "string" ? reader.result : "");
            reader.onerror = () => resolve("");
            reader.readAsDataURL(file);
          })
      );

      void Promise.all(readers).then((previews) => {
        setCampaignImagePreviews(previews.filter(Boolean));
      });
    }

    if (type === "project") {
      setSelectedProjectFile(names[0] || "");
    }

    if (type === "updates") {
      setSelectedUpdateFiles(names);
    }
  }

  function addProductRow() {
    setProducts((current) => [
      ...current,
      {
        name: "",
        availableQty: 0,
        pricePerUnit: 0,
        image: null,
        order: current.length,
        isActive: true,
      },
    ]);
  }

  function updateProduct(
    index: number,
    field: keyof ProductItem,
    value: string | number | boolean | null
  ) {
    setProducts((current) =>
      current.map((product, productIndex) =>
        productIndex === index
          ? { ...product, [field]: value }
          : product
      )
    );
  }

  async function uploadProductImage(
    index: number,
    file: File | null
  ) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage("Product image must be smaller than 10MB.");
      return;
    }

    const token = await getToken();

    if (!token) return;

    try {
      setUploadingProductIndex(index);
      setMessage("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/uploads/campaign-product", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to upload product image.");
      }

      setProducts((current) =>
        current.map((product, productIndex) =>
          productIndex === index
            ? { ...product, image: data.imageUrl || null }
            : product
        )
      );

      setMessage("Product image uploaded.");
    } catch (error) {
      console.error("Product image upload error:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to upload product image."
      );
    } finally {
      setUploadingProductIndex(null);
    }
  }

  async function deleteProductRow(index: number) {
    const product = products[index];

    if (!product) return;

    if (!product.id) {
      setProducts((current) =>
        current.filter((_, productIndex) => productIndex !== index)
      );
      return;
    }

    if (!window.confirm(`Delete "${product.name || "this product"}"?`)) {
      return;
    }

    const token = await getToken();

    if (!token) return;

    try {
      const response = await fetch("/api/campaign-products", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: product.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to delete product.");
      }

      setProducts((current) =>
        current.filter((_, productIndex) => productIndex !== index)
      );
      setMessage("Product deleted successfully.");
    } catch (error) {
      console.error("Delete product error:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete product."
      );
    }
  }

  async function saveProductsTab() {
    const token = await getToken();

    if (!token) return;

    for (let index = 0; index < products.length; index++) {
      const product = products[index];

      if (!product.name.trim()) {
        setMessage(`Product ${index + 1}: Material name is required.`);
        return;
      }

      if (Number(product.availableQty) <= 0) {
        setMessage(
          `Product ${index + 1}: Required quantity must be greater than 0.`
        );
        return;
      }

      if (Number(product.pricePerUnit) < 0) {
        setMessage(`Product ${index + 1}: Price cannot be negative.`);
        return;
      }
    }

    try {
      setSavingProducts(true);
      setMessage("");

      const campaignResponse = await fetch("/api/campaigns", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: campaignId,
          title: title.trim() || campaign?.title || "Campaign",
          slug: campaign?.slug || "",
          summary: campaign?.summary || "",
          story: campaign?.story || "",
          coverImage: imageUrls[0] || campaign?.coverImage || null,
          goalAmount: productTotalAmount > 0 ? productTotalAmount : campaign?.goalAmount ?? null,
          raisedAmount: campaign?.raisedAmount ?? null,
          startDate: campaign?.startDate || null,
          endDate: campaign?.endDate || null,
          isActive: activeCampaign,
          order: campaign?.order ?? 0,
        }),
      });

      const campaignResult = await campaignResponse.json();

      if (!campaignResponse.ok) {
        throw new Error(
          campaignResult?.error || "Failed to save campaign details."
        );
      }

      setCampaign(campaignResult);

      for (let index = 0; index < products.length; index++) {
        const product = products[index];

        const response = await fetch("/api/campaign-products", {
          method: product.id ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...(product.id ? { id: product.id } : {}),
            campaignId,
            name: product.name.trim(),
            availableQty: Number(product.availableQty),
            pricePerUnit: Number(product.pricePerUnit),
            image: product.image?.trim() || null,
            order: index,
            isActive: product.isActive,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || `Failed to save product ${index + 1}.`
          );
        }
      }

      await loadProducts();
      setMessage("Campaign and products saved successfully.");
    } catch (error) {
      console.error("Save Products tab error:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save campaign and products."
      );
    } finally {
      setSavingProducts(false);
    }
  }

  async function saveProjectTab() {
    
    if (!projectDescription.trim()) {
      setMessage("Project description is required.");
      return;
    }

    try {
      setSavingProject(true);
      setMessage("");

      const token = "cookie-auth";

      const existingResponse = await fetch(
        `/api/campaign-project?campaignId=${encodeURIComponent(campaignId)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const existingProject = existingResponse.ok
        ? await existingResponse.json()
        : null;

      const payload = {
        campaignId,
        videoUrl: videoUrl.trim() || null,
        description: projectDescription.trim(),
        images: projectImageUrls,
      };

      const response = await fetch("/api/campaign-project", {
        method: existingProject?.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          existingProject?.id
            ? { id: existingProject.id, ...payload }
            : payload
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to save project.");
      }

      setVideoUrl(
        typeof data.videoUrl === "string" ? data.videoUrl : ""
      );
      setProjectDescription(
        typeof data.description === "string" ? data.description : ""
      );

      if (Array.isArray(data.images)) {
        setProjectImageUrls(data.images.map(String));
      } else if (typeof data.images === "string" && data.images.trim()) {
        try {
          const parsed = JSON.parse(data.images);
          setProjectImageUrls(
            Array.isArray(parsed) ? parsed.map(String) : []
          );
        } catch {
          setProjectImageUrls(
            data.images
              .split(",")
              .map((value: string) => value.trim())
              .filter(Boolean)
          );
        }
      }

      setMessage(
        existingProject?.id
          ? "Project updated successfully."
          : "Project created successfully."
      );
    } catch (error) {
      console.error("Save project error:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save project."
      );
    } finally {
      setSavingProject(false);
    }
  }

  async function addCampaignUpdate() {
    
    if (!updateTitle.trim()) {
      setMessage("Update title is required.");
      return;
    }

    if (!updateDescription.trim()) {
      setMessage("Update description is required.");
      return;
    }

    try {
      setAddingUpdate(true);
      setMessage("");

      const token = "cookie-auth";

      const response = await fetch("/api/campaign-updates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          campaignId,
          title: updateTitle.trim(),
          description: updateDescription.trim(),
          images: updateImageUrls,
          isPublished: true,
          order: updates.length,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to create campaign update."
        );
      }

      const newUpdate: CampaignUpdateItem = {
        id: Number(data.id),
        title: String(data.title || updateTitle.trim()),
        description: String(data.description || updateDescription.trim()),
        images: Array.isArray(data.images)
          ? data.images.map(String)
          : typeof data.images === "string" && data.images.trim()
            ? (() => {
                try {
                  const parsed = JSON.parse(data.images);
                  return Array.isArray(parsed)
                    ? parsed.map(String)
                    : data.images
                        .split(",")
                        .map((value: string) => value.trim())
                        .filter(Boolean);
                } catch {
                  return data.images
                    .split(",")
                    .map((value: string) => value.trim())
                    .filter(Boolean);
                }
              })()
            : [],
        isPublished: Boolean(data.isPublished),
        publishedAt:
          typeof data.publishedAt === "string"
            ? data.publishedAt
            : null,
        createdAt:
          typeof data.createdAt === "string"
            ? data.createdAt
            : new Date().toISOString(),
      };

      setUpdates((current) => [newUpdate, ...current]);
      setUpdateTitle("");
      setUpdateDescription("");
      setUpdateImageUrls([]);
      setNewUpdateImageUrl("");
      setSelectedUpdateFiles([]);

      setMessage("Campaign update added successfully.");
    } catch (error) {
      console.error("Add update error:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to add campaign update."
      );
    } finally {
      setAddingUpdate(false);
    }
  }


  if (loading) {
    return (
      <main style={loadingPageStyle}>
        <div style={spinnerStyle}>⟳</div>
        <h2 style={{ margin: 0, color: "#111827" }}>
          Loading campaign...
        </h2>
      </main>
    );
  }

  if (!campaign) {
    return (
      <main style={loadingPageStyle}>
        <h2 style={{ margin: 0, color: "#111827" }}>
          Campaign could not be loaded
        </h2>

        <p style={{ color: "#667085" }}>
          {message || "Please go back to Campaigns and try again."}
        </p>

        <button
          type="button"
          onClick={() => router.push("/admin/campaigns")}
          style={darkButtonStyle}
        >
          ← Back to Campaigns
        </button>
      </main>
    );
  }

  return (
    <main style={mainStyle}>
      <div style={topBarStyle}>
        <div>
          <div style={breadcrumbStyle}>
            Dashboard / Campaigns / Edit
          </div>

          <h1 style={pageTitleStyle}>Edit Campaign</h1>
        </div>

        <button
          type="button"
          onClick={() => router.push("/admin/campaigns")}
          style={backButtonStyle}
        >
          ← Back
        </button>
      </div>

      {message && (
        <div style={messageBarStyle}>
          <span>{message}</span>

          <button
            type="button"
            onClick={() => setMessage("")}
            style={messageCloseStyle}
            aria-label="Close message"
          >
            ×
          </button>
        </div>
      )}

      <section style={summaryCardStyle}>
        <div style={summaryTopStyle}>
          <div>
            <div style={summaryEyebrowStyle}>CAMPAIGN MANAGEMENT</div>

            <h2 style={summaryTitleStyle}>{campaign.title}</h2>

            <p style={summarySlugStyle}>
              /campaigns/{campaign.slug}
            </p>
          </div>

          <div style={statusPillStyle(activeCampaign)}>
            {activeCampaign ? "Active" : "Inactive"}
          </div>
        </div>

        <div style={summaryGridStyle}>
          <SummaryItem
            label="Amount collected"
            value={formatAmount(amountCollected)}
          />

          <SummaryItem
            label="Amount needed"
            value={formatAmount(amountNeeded)}
          />

          <SummaryItem
            label="Campaign goal"
            value={formatAmount(campaign.goalAmount)}
          />

          <SummaryItem
            label="Progress"
            value={`${percentage}%`}
          />
        </div>

        <div style={progressOuterStyle}>
          <div
            style={{
              ...progressInnerStyle,
              width: `${percentage}%`,
            }}
          />
        </div>
      </section>

      <div style={tabBarStyle}>
        <TabButton
          active={activeTab === "story"}
          onClick={() => setActiveTab("story")}
        >
          Story &amp; Gallery
        </TabButton>

        <TabButton
          active={activeTab === "products"}
          onClick={() => setActiveTab("products")}
        >
          Products
        </TabButton>

        <TabButton
          active={activeTab === "project"}
          onClick={() => setActiveTab("project")}
        >
          Project
        </TabButton>

        <TabButton
          active={activeTab === "updates"}
          onClick={() => setActiveTab("updates")}
        >
          Updates
        </TabButton>
      </div>

      {activeTab === "story" && (
        <section style={productsPageStyle}>
          <div style={productsDetailsCardStyle}>
            <div style={fieldStyle}>
              <label style={productsLabelStyle}>Campaign Story</label>
              <p style={productsSubTextStyle}>
                Supports Markdown — use ## for section headings, **text** for bold, - for bullet
                lists, and &gt; for a highlighted quote.
              </p>
              <textarea
                value={storyText}
                onChange={(event) => setStoryText(event.target.value)}
                rows={16}
                placeholder={"## About the Campaign\n\nWrite the campaign's story here...\n\n> \"A quote from someone affected by this cause.\"\n— Attribution\n\n## Our Support Includes\n- Item one\n- Item two"}
                style={{ ...inputStyle, height: "auto", padding: "12px", fontFamily: "monospace", fontSize: "13px", lineHeight: 1.6 }}
              />
            </div>

            <div style={formFooterStyle}>
              <button
                type="button"
                onClick={() => void saveStoryTab()}
                disabled={savingStory}
                style={{
                  ...darkButtonStyle,
                  opacity: savingStory ? 0.6 : 1,
                }}
              >
                {savingStory ? "Saving..." : "Save story"}
              </button>
            </div>
          </div>

          <div style={productsDetailsCardStyle}>
            <label style={productsLabelStyle}>Gallery Photos</label>
            <p style={productsSubTextStyle}>
              Photos shown in this campaign&apos;s public gallery, below the story and cost
              breakdown.
            </p>

            <div style={campaignImageStripStyle}>
              {(campaign?.photos || []).map((photo) => (
                <div key={photo.id} style={campaignThumbStyle}>
                  <img src={photo.image} alt={photo.caption || ""} style={campaignThumbImageStyle} />
                  <button
                    type="button"
                    onClick={() => void deleteGalleryPhoto(photo)}
                    disabled={deletingGalleryPhotoId === photo.id}
                    style={campaignThumbDeleteStyle}
                    aria-label="Remove photo"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div style={productsChooseRowStyle}>
              <label style={chooseFileButtonStyle}>
                {uploadingGalleryPhoto ? "Uploading..." : "Add Photo"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={uploadingGalleryPhoto}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadGalleryPhoto(file);
                    event.currentTarget.value = "";
                  }}
                  style={{ display: "none" }}
                />
              </label>
              <span style={productsFileCountStyle}>{(campaign?.photos || []).length} photo(s)</span>
            </div>
          </div>

          <div style={productsDetailsCardStyle}>
            <label style={productsLabelStyle}>Gallery Videos (YouTube)</label>
            <p style={productsSubTextStyle}>
              Add as many videos as you need — each shows in the public gallery below the photos.
            </p>

            <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
              <input
                value={galleryVideoTitle}
                onChange={(e) => setGalleryVideoTitle(e.target.value)}
                placeholder="Video title"
                disabled={addingGalleryVideo}
                style={{ ...inputStyle, flex: "1 1 200px" }}
              />
              <input
                value={galleryVideoUrl}
                onChange={(e) => setGalleryVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                disabled={addingGalleryVideo}
                style={{ ...inputStyle, flex: "2 1 280px" }}
              />
              <button
                type="button"
                onClick={() => void addGalleryVideo()}
                disabled={addingGalleryVideo}
                style={chooseFileButtonStyle}
              >
                {addingGalleryVideo ? "Adding..." : "+ Add Video"}
              </button>
            </div>

            {(campaign?.videos?.length ?? 0) > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "14px" }}>
                {campaign!.videos!.map((video) => (
                  <div
                    key={video.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                      padding: "10px 12px",
                      border: "1px solid #e1e5ea",
                      borderRadius: "6px",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#172033" }}>
                        {video.title || "Untitled video"}
                      </div>
                      <div style={{ fontSize: "11px", color: "#667085", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {video.videoUrl}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteGalleryVideo(video)}
                      disabled={deletingGalleryVideoId === video.id}
                      style={campaignThumbDeleteStyle}
                      aria-label="Remove video"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ ...productsSubTextStyle, marginTop: "14px" }}>No videos yet.</p>
            )}
          </div>
        </section>
      )}

      {activeTab === "products" && (
        <section style={productsPageStyle}>
          <div style={productsDetailsCardStyle}>
            <div style={fieldStyle}>
              <label style={productsLabelStyle}>Campaign name</label>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                style={productsLargeInputStyle}
              />
              <div style={productsSubTextStyle}>Save from the Products tab.</div>
            </div>

            <div style={productsAmountCollectedStyle}>
              <strong>Amount collected:</strong>{" "}
              {formatAmount(amountCollected)} of {formatAmount(productTotalAmount)} needed
            </div>
          </div>

          <div style={productsMainCardStyle}>
            <div style={fieldStyle}>
              <label style={productsSectionLabelStyle}>Images (multiple)</label>
              <div style={productsSubTextStyle}>
                First image is the main campaign image. Add more with “Choose file”; click × to remove.
              </div>

              <div style={campaignImageStripStyle}>
                {[...imageUrls, ...campaignImagePreviews].map((image, index) => (
                  <div key={`${image}-${index}`} style={campaignThumbStyle}>
                    <img src={image} alt={`Campaign ${index + 1}`} style={campaignThumbImageStyle} />
                    <button
                      type="button"
                      onClick={() => {
                        if (index < imageUrls.length) {
                          removeImageUrl(index);
                        } else {
                          setCampaignImagePreviews((current) =>
                            current.filter((_, previewIndex) => previewIndex !== index - imageUrls.length)
                          );
                        }
                      }}
                      style={campaignThumbDeleteStyle}
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                    {index === 0 && <span style={campaignMainBadgeStyle}>Main</span>}
                  </div>
                ))}
              </div>

              <div style={productsChooseRowStyle}>
                <label style={chooseFileButtonStyle}>
                  Choose Files
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(event) => {
                      handleFiles(event.target.files, "products");
                      event.currentTarget.value = "";
                    }}
                    style={{ display: "none" }}
                  />
                </label>
                <span style={productsFileCountStyle}>
                  {imageUrls.length + campaignImagePreviews.length} image(s) ({selectedFiles.length} new)
                </span>
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={productsLabelStyle}>Title</label>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                style={productsLargeInputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label style={productsLabelStyle}>Organizer name (shown on campaigns list)</label>
              <input
                type="text"
                value={organizerName}
                onChange={(event) => setOrganizerName(event.target.value)}
                style={productsLargeInputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label style={productsLabelStyle}>Image overlay text (on card image)</label>
              <input
                type="text"
                value={overlayText}
                onChange={(event) => setOverlayText(event.target.value)}
                style={productsLargeInputStyle}
              />
            </div>

            <div style={productsCheckboxGridStyle}>
              <label style={productsCheckboxRowStyle}>
                <input
                  type="checkbox"
                  checked={taxBenefitEligible}
                  onChange={(event) => setTaxBenefitEligible(event.target.checked)}
                />
                <span>
                  <strong>Tax benefit eligible</strong>
                  <small>Show badge on campaigns list</small>
                </span>
              </label>

              <label style={productsCheckboxRowStyle}>
                <input
                  type="checkbox"
                  checked={activeCampaign}
                  onChange={(event) => setActiveCampaign(event.target.checked)}
                />
                <span>
                  <strong>Active campaign</strong>
                  <small>Visible on main website campaigns page</small>
                </span>
              </label>
            </div>

            <div style={fieldStyle}>
              <label style={productsLabelStyle}>Total amount needed (₹)</label>
              <input
                type="number"
                value={productTotalAmount || ""}
                readOnly
                style={{ ...productsLargeInputStyle, background: "#f8fafc" }}
              />
              <div style={productsSubTextStyle}>
                Automatically calculated from required quantity × price per unit.
              </div>
            </div>

            <div style={productsMoneyCardStyle}>
              <button
                type="button"
                onClick={() => setProductsExpanded((current) => !current)}
                style={productsMoneyHeaderButtonStyle}
                aria-expanded={productsExpanded}
              >
                <strong>Where your money goes?</strong>
                <span>{productsExpanded ? "⌃" : "⌄"}</span>
              </button>

              {productsExpanded && (
                <div style={productsMoneyBodyStyle}>
                  <div style={productsSubTextStyle}>
                    Add items: material name, required quantity, price per unit, and image.
                  </div>

                  <div style={productRowsStyle}>
                    {products.map((product, index) => (
                      <div
                        key={product.id || `new-product-${index}`}
                        style={referenceProductRowStyle}
                      >
                        <input
                          type="text"
                          value={product.name}
                          onChange={(event) => updateProduct(index, "name", event.target.value)}
                          placeholder="Material name"
                          style={referenceProductInputStyle}
                        />

                        <input
                          type="number"
                          min="1"
                          value={product.availableQty || ""}
                          onChange={(event) =>
                            updateProduct(
                              index,
                              "availableQty",
                              event.target.value === "" ? 0 : Number(event.target.value)
                            )
                          }
                          placeholder="Required quantity"
                          style={referenceProductInputStyle}
                        />

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={product.pricePerUnit || ""}
                          onChange={(event) =>
                            updateProduct(
                              index,
                              "pricePerUnit",
                              event.target.value === "" ? 0 : Number(event.target.value)
                            )
                          }
                          placeholder="Price per unit"
                          style={referenceProductInputStyle}
                        />

                        <div style={referenceProductImageCellStyle}>
                          {product.image && (
                            <div style={referenceProductImageWrapStyle}>
                              <img
                                src={product.image}
                                alt={product.name || "Product"}
                                style={referenceProductImageStyle}
                              />
                              <button
                                type="button"
                                onClick={() => updateProduct(index, "image", null)}
                                style={miniImageDeleteStyle}
                                aria-label="Remove product image"
                              >
                                ×
                              </button>
                            </div>
                          )}

                          <label style={chooseFileButtonStyle}>
                            Choose File
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              disabled={uploadingProductIndex === index}
                              onChange={(event) => {
                                const file = event.target.files?.[0] || null;
                                void uploadProductImage(index, file);
                                event.currentTarget.value = "";
                              }}
                              style={{ display: "none" }}
                            />
                          </label>

                          <span style={referenceFileStatusStyle}>
                            {uploadingProductIndex === index
                              ? "Uploading..."
                              : product.image
                              ? "Image added"
                              : "No file chosen"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => void deleteProductRow(index)}
                          style={referenceRowDeleteStyle}
                          aria-label={`Delete ${product.name || "product"}`}
                        >
                          🗑
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addProductRow}
                    style={addRowButtonStyle}
                  >
                    +&nbsp; Add row
                  </button>
                </div>
              )}
            </div>

            {loadingProducts && (
              <div style={loadingInlineStyle}>Loading saved products...</div>
            )}

            <div style={referenceSaveFooterStyle}>
              <button
                type="button"
                onClick={saveProductsTab}
                disabled={savingProducts}
                style={{
                  ...darkButtonStyle,
                  padding: "12px 20px",
                  fontSize: "14px",
                  opacity: savingProducts ? 0.6 : 1,
                }}
              >
                {savingProducts ? "Saving products..." : "Save products"}
              </button>
            </div>
          </div>
        </section>
      )}

      {activeTab === "project" && (
        <section style={panelStyle}>
          <h3 style={panelTitleStyle}>Project</h3>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              Video URL (or upload file below)
            </label>

            <input
              type="url"
              value={videoUrl}
              onChange={(event) => setVideoUrl(event.target.value)}
              placeholder="https://..."
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Or upload video file</label>

            <input
              type="file"
              accept="video/*"
              onChange={(event) =>
                handleFiles(event.target.files, "project")
              }
              style={fileInputStyle}
            />

            {selectedProjectFile && (
              <div style={fileCountStyle}>{selectedProjectFile}</div>
            )}
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Description</label>

            <div style={toolbarStyle}>
              <button type="button" style={toolbarButtonStyle}>
                B
              </button>
              <button type="button" style={toolbarButtonStyle}>
                I
              </button>
              <button type="button" style={toolbarButtonStyle}>
                S
              </button>
              <button type="button" style={toolbarButtonStyle}>
                U
              </button>
              <span style={toolbarDividerStyle} />
              <button type="button" style={toolbarButtonStyle}>
                H1
              </button>
              <button type="button" style={toolbarButtonStyle}>
                H2
              </button>
              <button type="button" style={toolbarButtonStyle}>
                H3
              </button>
              <span style={toolbarDividerStyle} />
              <button type="button" style={toolbarButtonStyle}>
                •
              </button>
              <button type="button" style={toolbarButtonStyle}>
                1.
              </button>
              <button type="button" style={toolbarButtonStyle}>
                ≡
              </button>
              <button type="button" style={toolbarButtonStyle}>
                🔗
              </button>
            </div>

            <textarea
              rows={10}
              value={projectDescription}
              onChange={(event) =>
                setProjectDescription(event.target.value)
              }
              placeholder="Write the campaign project description..."
              style={editorStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Images</label>

            <div style={inlineFormStyle}>
              <input
                type="url"
                value={newProjectImageUrl}
                onChange={(event) =>
                  setNewProjectImageUrl(event.target.value)
                }
                placeholder="Paste project image URL"
                style={inputStyle}
              />

              <button
                type="button"
                onClick={addProjectImageUrl}
                style={smallButtonStyle}
              >
                Add image
              </button>
            </div>

            {projectImageUrls.length > 0 && (
              <div style={imageGridStyle}>
                {projectImageUrls.map((image, index) => (
                  <div key={`${image}-${index}`} style={imageCardStyle}>
                    <div
                      style={{
                        ...imagePreviewStyle,
                        backgroundImage: `url("${escapeCssUrl(image)}")`,
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={formFooterStyle}>
            <button
              type="button"
              onClick={saveProjectTab}
              disabled={savingProject}
              style={{
                ...darkButtonStyle,
                opacity: savingProject ? 0.6 : 1,
              }}
            >
              {savingProject ? "Saving..." : "Save project"}
            </button>
          </div>
        </section>
      )}

      {activeTab === "updates" && (
        <section style={panelStyle}>
          <h3 style={panelTitleStyle}>Add update</h3>

          <div style={fieldStyle}>
            <label style={labelStyle}>Title</label>

            <input
              type="text"
              value={updateTitle}
              onChange={(event) => setUpdateTitle(event.target.value)}
              placeholder="Campaign update title"
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Description</label>

            <div style={toolbarStyle}>
              <button type="button" style={toolbarButtonStyle}>
                B
              </button>
              <button type="button" style={toolbarButtonStyle}>
                I
              </button>
              <button type="button" style={toolbarButtonStyle}>
                S
              </button>
              <button type="button" style={toolbarButtonStyle}>
                U
              </button>
              <span style={toolbarDividerStyle} />
              <button type="button" style={toolbarButtonStyle}>
                H1
              </button>
              <button type="button" style={toolbarButtonStyle}>
                H2
              </button>
              <button type="button" style={toolbarButtonStyle}>
                H3
              </button>
              <span style={toolbarDividerStyle} />
              <button type="button" style={toolbarButtonStyle}>
                🔗
              </button>
            </div>

            <textarea
              rows={8}
              value={updateDescription}
              onChange={(event) =>
                setUpdateDescription(event.target.value)
              }
              placeholder="Write the latest campaign update..."
              style={editorStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Images (optional)</label>

            <div style={inlineFormStyle}>
              <input
                type="url"
                value={newUpdateImageUrl}
                onChange={(event) =>
                  setNewUpdateImageUrl(event.target.value)
                }
                placeholder="Paste update image URL"
                style={inputStyle}
              />

              <button
                type="button"
                onClick={addUpdateImageUrl}
                style={smallButtonStyle}
              >
                Add image
              </button>
            </div>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(event) =>
                handleFiles(event.target.files, "updates")
              }
              style={fileInputStyle}
            />

            {selectedUpdateFiles.length > 0 && (
              <div style={fileCountStyle}>
                {selectedUpdateFiles.length} image(s) selected
              </div>
            )}
          </div>

          <div style={formFooterStyle}>
            <button
              type="button"
              onClick={addCampaignUpdate}
              disabled={addingUpdate}
              style={{
                ...darkButtonStyle,
                opacity: addingUpdate ? 0.6 : 1,
              }}
            >
              {addingUpdate ? "Adding..." : "Add update"}
            </button>
          </div>

          <div style={updatesSectionStyle}>
            <h4 style={updatesTitleStyle}>
              Updates ({updates.length})
            </h4>

            {loadingUpdates ? (
              <div style={emptyTextStyle}>Loading updates...</div>
            ) : updates.length === 0 ? (
              <div style={emptyUpdatesStyle}>No updates yet.</div>
            ) : (
              <div>
                {updates.map((update) => (
                  <div key={update.id} style={updateRowStyle}>
                    <div>
                      <div style={updateTitleStyle}>
                        {update.title}
                      </div>

                      <div style={updateDescriptionStyle}>
                        {update.description}
                      </div>

                      <div style={updateMetaStyle}>
                        {update.publishedAt
                          ? formatDate(update.publishedAt)
                          : "Draft"}
                      </div>
                    </div>

                    <span style={statusPillStyle(update.isPublished)}>
                      {update.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={summaryItemStyle}>
      <div style={summaryLabelStyle}>{label}</div>
      <div style={summaryValueStyle}>{value}</div>
    </div>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...tabButtonStyle,
        ...(active ? activeTabButtonStyle : {}),
      }}
    >
      {children}
    </button>
  );
}

function formatAmount(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  return `₹${value.toLocaleString("en-IN")}`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function escapeCssUrl(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}

const mainStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: "28px 30px 40px",
  boxSizing: "border-box",
};

const topBarStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: "20px",
  marginBottom: "18px",
};

const breadcrumbStyle: CSSProperties = {
  fontSize: "10px",
  color: "#98a2b3",
  marginBottom: "6px",
};

const pageTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "22px",
  fontWeight: 750,
  color: "#101828",
};

const backButtonStyle: CSSProperties = {
  height: "34px",
  padding: "0 14px",
  border: "1px solid #d0d5dd",
  borderRadius: "6px",
  background: "#ffffff",
  color: "#344054",
  cursor: "pointer",
  fontSize: "11px",
  fontWeight: 600,
};

const summaryCardStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "7px",
  padding: "18px",
  marginBottom: "16px",
};

const summaryTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "20px",
  marginBottom: "16px",
};

const summaryEyebrowStyle: CSSProperties = {
  color: "#98a2b3",
  fontSize: "9px",
  fontWeight: 700,
  letterSpacing: "0.8px",
  marginBottom: "5px",
};

const summaryTitleStyle: CSSProperties = {
  margin: 0,
  color: "#101828",
  fontSize: "18px",
  fontWeight: 750,
};

const summarySlugStyle: CSSProperties = {
  margin: "5px 0 0",
  color: "#667085",
  fontSize: "10px",
};

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "10px",
};

const summaryItemStyle: CSSProperties = {
  border: "1px solid #eef0f3",
  borderRadius: "6px",
  padding: "12px",
  background: "#fafbfc",
};

const summaryLabelStyle: CSSProperties = {
  color: "#98a2b3",
  fontSize: "9px",
  marginBottom: "4px",
};

const summaryValueStyle: CSSProperties = {
  color: "#111827",
  fontSize: "13px",
  fontWeight: 700,
};

const progressOuterStyle: CSSProperties = {
  marginTop: "15px",
  height: "7px",
  background: "#eef2f6",
  borderRadius: "999px",
  overflow: "hidden",
};

const progressInnerStyle: CSSProperties = {
  height: "100%",
  background: "#2563eb",
  borderRadius: "999px",
};

function statusPillStyle(active: boolean): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "70px",
    height: "25px",
    padding: "0 10px",
    borderRadius: "999px",
    background: active ? "#ecfdf3" : "#f2f4f7",
    color: active ? "#027a48" : "#667085",
    fontSize: "10px",
    fontWeight: 700,
  };
}

const tabBarStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "2px",
  borderBottom: "1px solid #dfe3e8",
  marginBottom: "12px",
};

const tabButtonStyle: CSSProperties = {
  border: "none",
  borderBottom: "2px solid transparent",
  background: "transparent",
  padding: "11px 14px 10px",
  color: "#667085",
  fontSize: "11px",
  fontWeight: 650,
  cursor: "pointer",
};

const activeTabButtonStyle: CSSProperties = {
  color: "#d65336",
  borderBottom: "2px solid #d65336",
};

const panelStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "7px",
  padding: "16px",
};

const panelTitleStyle: CSSProperties = {
  margin: "0 0 4px",
  color: "#101828",
  fontSize: "14px",
  fontWeight: 750,
};

const panelHintStyle: CSSProperties = {
  margin: "0 0 16px",
  color: "#667085",
  fontSize: "10px",
  lineHeight: 1.5,
};

const fieldStyle: CSSProperties = {
  marginBottom: "16px",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "6px",
  color: "#344054",
  fontSize: "10px",
  fontWeight: 700,
};

const helperTextStyle: CSSProperties = {
  color: "#98a2b3",
  fontSize: "9px",
  lineHeight: 1.4,
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: "36px",
  border: "1px solid #d0d5dd",
  borderRadius: "5px",
  padding: "0 10px",
  boxSizing: "border-box",
  outline: "none",
  color: "#344054",
  background: "#ffffff",
  fontSize: "10px",
};

const inlineFormStyle: CSSProperties = {
  display: "flex",
  gap: "7px",
  alignItems: "center",
  marginTop: "7px",
};

const smallButtonStyle: CSSProperties = {
  height: "36px",
  padding: "0 12px",
  border: "1px solid #d0d5dd",
  borderRadius: "5px",
  background: "#ffffff",
  color: "#344054",
  cursor: "pointer",
  fontSize: "10px",
  fontWeight: 650,
  whiteSpace: "nowrap",
};

const fileInputStyle: CSSProperties = {
  display: "block",
  marginTop: "9px",
  fontSize: "10px",
  color: "#667085",
};

const fileCountStyle: CSSProperties = {
  marginTop: "7px",
  color: "#475467",
  fontSize: "9px",
};

const imageGridStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "7px",
  marginTop: "9px",
};

const imageCardStyle: CSSProperties = {
  width: "82px",
  height: "62px",
  position: "relative",
  borderRadius: "5px",
  overflow: "hidden",
  border: "1px solid #d0d5dd",
  background: "#eef2f6",
};

const imagePreviewStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  backgroundPosition: "center",
  backgroundSize: "cover",
  backgroundRepeat: "no-repeat",
};

const removeImageButtonStyle: CSSProperties = {
  position: "absolute",
  top: "4px",
  right: "4px",
  width: "20px",
  height: "20px",
  border: "none",
  borderRadius: "4px",
  background: "rgba(255,255,255,0.92)",
  color: "#344054",
  cursor: "pointer",
  fontSize: "10px",
};

const mainImageLabelStyle: CSSProperties = {
  position: "absolute",
  left: "4px",
  bottom: "4px",
  padding: "2px 5px",
  borderRadius: "3px",
  background: "#d65336",
  color: "#ffffff",
  fontSize: "8px",
  fontWeight: 700,
};

const checkboxBlockStyle: CSSProperties = {
  borderTop: "1px solid #eef0f3",
  paddingTop: "12px",
  marginTop: "12px",
};

const checkboxLabelStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "#344054",
  fontSize: "10px",
  fontWeight: 650,
};

const checkboxHintStyle: CSSProperties = {
  marginTop: "4px",
  marginLeft: "24px",
  color: "#98a2b3",
  fontSize: "9px",
};

const formFooterStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: "18px",
  paddingTop: "12px",
  borderTop: "1px solid #eef0f3",
};

const darkButtonStyle: CSSProperties = {
  height: "36px",
  padding: "0 14px",
  border: "none",
  borderRadius: "5px",
  background: "#111827",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: "10px",
  fontWeight: 700,
};

const productsPreviewSectionStyle: CSSProperties = {
  marginTop: "18px",
  borderTop: "1px solid #eef0f3",
  paddingTop: "14px",
};

const productsPreviewTitleStyle: CSSProperties = {
  color: "#344054",
  fontSize: "10px",
  fontWeight: 700,
  marginBottom: "7px",
};

const productsPageStyle: CSSProperties = {
  width: "100%",
};

const productsDetailsCardStyle: CSSProperties = {
  padding: "24px 28px",
  border: "1px solid #e1e5ea",
  borderRadius: "10px",
  background: "#ffffff",
  marginBottom: "24px",
};

const productsMainCardStyle: CSSProperties = {
  padding: "28px",
  border: "1px solid #e1e5ea",
  borderRadius: "10px",
  background: "#ffffff",
};

const productsLabelStyle: CSSProperties = {
  display: "block",
  marginBottom: "7px",
  color: "#344054",
  fontSize: "14px",
  fontWeight: 700,
};

const productsSectionLabelStyle: CSSProperties = {
  display: "block",
  marginBottom: "5px",
  color: "#344054",
  fontSize: "16px",
  fontWeight: 700,
};

const productsLargeInputStyle: CSSProperties = {
  width: "100%",
  height: "44px",
  boxSizing: "border-box",
  padding: "0 12px",
  border: "1px solid #d0d5dd",
  borderRadius: "5px",
  outline: "none",
  color: "#344054",
  background: "#ffffff",
  fontSize: "14px",
};

const productsSubTextStyle: CSSProperties = {
  marginTop: "5px",
  color: "#667085",
  fontSize: "13px",
  lineHeight: 1.45,
};

const productsAmountCollectedStyle: CSSProperties = {
  marginTop: "6px",
  color: "#667085",
  fontSize: "15px",
};

const campaignImageStripStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginTop: "12px",
};

const campaignThumbStyle: CSSProperties = {
  position: "relative",
  width: "88px",
  height: "66px",
  overflow: "hidden",
  borderRadius: "6px",
  border: "1px solid #d0d5dd",
  background: "#f8fafc",
};

const campaignThumbImageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const campaignThumbDeleteStyle: CSSProperties = {
  position: "absolute",
  top: "4px",
  right: "4px",
  width: "24px",
  height: "24px",
  border: "1px solid #d0d5dd",
  borderRadius: "5px",
  background: "#ffffff",
  color: "#344054",
  cursor: "pointer",
  fontSize: "16px",
  lineHeight: 1,
};

const campaignMainBadgeStyle: CSSProperties = {
  position: "absolute",
  left: "4px",
  bottom: "4px",
  padding: "3px 7px",
  borderRadius: "4px",
  background: "#f97316",
  color: "#ffffff",
  fontSize: "10px",
  fontWeight: 700,
};

const productsChooseRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginTop: "10px",
};

const chooseFileButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "42px",
  boxSizing: "border-box",
  padding: "0 18px",
  border: "1px solid #d0d5dd",
  borderRadius: "5px",
  background: "#ffffff",
  color: "#344054",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const productsFileCountStyle: CSSProperties = {
  color: "#667085",
  fontSize: "14px",
};

const productsCheckboxGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  margin: "12px 0 22px",
};

const productsCheckboxRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  color: "#344054",
  fontSize: "14px",
};

const productsMoneyCardStyle: CSSProperties = {
  marginTop: "22px",
  border: "1px solid #dfe3e8",
  borderRadius: "8px",
  overflow: "hidden",
  background: "#ffffff",
};

const productsMoneyHeaderButtonStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "17px 20px",
  border: "none",
  borderBottom: "1px solid #dfe3e8",
  background: "#f8fafc",
  color: "#1f2937",
  cursor: "pointer",
  fontSize: "16px",
  textAlign: "left",
};

const productsMoneyBodyStyle: CSSProperties = {
  padding: "22px 20px 18px",
};

const productRowsStyle: CSSProperties = {
  marginTop: "22px",
};

const referenceProductRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.25fr 1.2fr 1.2fr 1.35fr 42px",
  gap: "12px",
  alignItems: "center",
  marginBottom: "12px",
};

const referenceProductInputStyle: CSSProperties = {
  width: "100%",
  height: "46px",
  boxSizing: "border-box",
  padding: "0 12px",
  border: "1px solid #d0d5dd",
  borderRadius: "5px",
  outline: "none",
  color: "#101828",
  background: "#ffffff",
  fontSize: "15px",
};

const referenceProductImageCellStyle: CSSProperties = {
  minHeight: "46px",
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const referenceProductImageWrapStyle: CSSProperties = {
  position: "relative",
  width: "70px",
  height: "70px",
  flex: "0 0 70px",
};

const referenceProductImageStyle: CSSProperties = {
  width: "70px",
  height: "70px",
  objectFit: "contain",
  borderRadius: "5px",
};

const miniImageDeleteStyle: CSSProperties = {
  position: "absolute",
  top: "-5px",
  right: "-5px",
  width: "23px",
  height: "23px",
  padding: 0,
  border: "1px solid #d0d5dd",
  borderRadius: "5px",
  background: "#ffffff",
  color: "#344054",
  cursor: "pointer",
  fontSize: "15px",
};

const referenceFileStatusStyle: CSSProperties = {
  color: "#667085",
  fontSize: "14px",
  whiteSpace: "nowrap",
};

const referenceRowDeleteStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  padding: 0,
  border: "1px solid #d0d5dd",
  borderRadius: "5px",
  background: "#ffffff",
  color: "#475467",
  cursor: "pointer",
  fontSize: "16px",
};

const addRowButtonStyle: CSSProperties = {
  marginTop: "2px",
  minHeight: "42px",
  padding: "0 16px",
  border: "1px solid #d0d5dd",
  borderRadius: "5px",
  background: "#ffffff",
  color: "#344054",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 700,
};

const referenceSaveFooterStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: "18px",
  paddingTop: "18px",
  borderTop: "1px solid #e4e7ec",
};

const productsEditorSectionStyle: CSSProperties = {
  marginTop: "14px",
  padding: "14px",
  border: "1px solid #e6e8ec",
  borderRadius: "10px",
  background: "#fafbfc",
};

const productsEditorHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "12px",
};

const editableProductRowStyle: CSSProperties = {
  position: "relative",
  marginTop: "10px",
  padding: "12px",
  border: "1px solid #e5e7eb",
  borderRadius: "9px",
  background: "#ffffff",
};

const productRowNumberStyle: CSSProperties = {
  position: "absolute",
  top: "10px",
  right: "10px",
  width: "24px",
  height: "24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  background: "#f1f3f5",
  color: "#667085",
  fontSize: "11px",
  fontWeight: 700,
};

const productFieldsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(220px, 1.6fr) minmax(140px, 0.8fr) minmax(140px, 0.8fr) minmax(220px, 1fr)",
  gap: "10px",
};

const productBottomRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  marginTop: "8px",
  paddingTop: "8px",
  borderTop: "1px solid #f0f2f4",
};

const productImagePreviewWrapStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginRight: "auto",
};

const productImagePreviewStyle: CSSProperties = {
  width: "46px",
  height: "46px",
  objectFit: "cover",
  borderRadius: "7px",
  border: "1px solid #e5e7eb",
};

const emptyProductsStyle: CSSProperties = {
  padding: "18px",
  textAlign: "center",
  border: "1px dashed #d0d5dd",
  borderRadius: "8px",
  color: "#667085",
  fontSize: "12px",
  background: "#fff",
};

const dangerButtonStyle: CSSProperties = {
  border: "1px solid #f1b5b5",
  background: "#fff5f5",
  color: "#c62828",
  borderRadius: "6px",
  padding: "7px 11px",
  fontSize: "11px",
  fontWeight: 600,
  cursor: "pointer",
};

const productRowStyle: CSSProperties = {
  padding: "9px 0",
  borderBottom: "1px solid #f0f2f4",
};

const loadingInlineStyle: CSSProperties = {
  marginTop: "10px",
  color: "#667085",
  fontSize: "10px",
};

const toolbarStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  padding: "7px",
  border: "1px solid #d0d5dd",
  borderBottom: "none",
  borderRadius: "5px 5px 0 0",
  background: "#f8fafc",
};

const toolbarButtonStyle: CSSProperties = {
  minWidth: "24px",
  height: "24px",
  padding: "0 4px",
  border: "none",
  background: "transparent",
  color: "#475467",
  borderRadius: "3px",
  cursor: "pointer",
  fontSize: "10px",
  fontWeight: 650,
};

const toolbarDividerStyle: CSSProperties = {
  width: "1px",
  height: "17px",
  background: "#d0d5dd",
  margin: "0 3px",
};

const editorStyle: CSSProperties = {
  width: "100%",
  minHeight: "180px",
  border: "1px solid #d0d5dd",
  borderRadius: "0 0 5px 5px",
  padding: "10px",
  boxSizing: "border-box",
  outline: "none",
  resize: "vertical",
  color: "#344054",
  fontSize: "11px",
  lineHeight: 1.55,
  fontFamily: "inherit",
};

const updatesSectionStyle: CSSProperties = {
  marginTop: "20px",
  paddingTop: "16px",
  borderTop: "1px solid #eef0f3",
};

const updatesTitleStyle: CSSProperties = {
  margin: "0 0 10px",
  color: "#344054",
  fontSize: "12px",
  fontWeight: 750,
};

const emptyUpdatesStyle: CSSProperties = {
  padding: "35px 10px",
  textAlign: "center",
  color: "#98a2b3",
  fontSize: "10px",
};

const emptyTextStyle: CSSProperties = {
  color: "#98a2b3",
  fontSize: "10px",
};

const updateRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "15px",
  padding: "12px 0",
  borderBottom: "1px solid #eef0f3",
};

const updateTitleStyle: CSSProperties = {
  color: "#101828",
  fontSize: "11px",
  fontWeight: 700,
  marginBottom: "4px",
};

const updateDescriptionStyle: CSSProperties = {
  color: "#667085",
  fontSize: "10px",
  lineHeight: 1.5,
  maxWidth: "700px",
};

const updateMetaStyle: CSSProperties = {
  marginTop: "5px",
  color: "#98a2b3",
  fontSize: "9px",
};

const messageBarStyle: CSSProperties = {
  minHeight: "36px",
  marginBottom: "12px",
  padding: "7px 10px",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  background: "#ffffff",
  border: "1px solid #dbe5f0",
  borderRadius: "5px",
  color: "#475467",
  fontSize: "10px",
};

const messageCloseStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#98a2b3",
  fontSize: "16px",
  cursor: "pointer",
};

const loadingPageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "#f7f8fa",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  gap: "10px",
};

const spinnerStyle: CSSProperties = {
  fontSize: "28px",
  color: "#2563eb",
};
