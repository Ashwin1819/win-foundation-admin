"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

type CostBreakdownItem = { item: string; qty: number; pricePerUnit: number };

type CampaignCategory = {
  id: number;
  name: string;
  slug: string;
  order: number;
};

type Campaign = {
  id: string;
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
  status?: "ACTIVE" | "COMPLETED";
  categoryId?: number | null;
  costBreakdown?: CostBreakdownItem[];
  presetAmounts?: number[] | null;
  videoUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type CampaignForm = {
  title: string;
  slug: string;
  summary: string;
  story: string;
  coverImage: string;
  goalAmount: string;
  raisedAmount: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  order: number;
  status: "ACTIVE" | "COMPLETED";
  categoryId: string;
  costBreakdown: CostBreakdownItem[];
  presetAmounts: string;
  videoUrl: string;
};

type DonationRecord = {
  amount?: number | string;
  paymentStatus?: string;
  campaignId?: string | null;
  campaign?: { id?: string | null } | null;
};

type CampaignRowStats = {
  collected: number;
  completed: number;
  failed: number;
  failedCount: number;
  productTitle: string;
  updates: number;
};

type SortField =
  | "menuOrder"
  | "title"
  | "createdAt";

type SortDirection =
  | "oldest"
  | "newest";



const emptyForm: CampaignForm = {
  title: "",
  slug: "",
  summary: "",
  story: "",
  coverImage: "",
  goalAmount: "",
  raisedAmount: "",
  startDate: "",
  endDate: "",
  isActive: true,
  order: 0,
  status: "ACTIVE",
  categoryId: "",
  costBreakdown: [],
  presetAmounts: "",
  videoUrl: "",
};

export default function CampaignsPage() {
  const router = useRouter();

  const [campaigns, setCampaigns] =
    useState<Campaign[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [, setDeletingId] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [sortField] =
    useState<SortField>("menuOrder");

  const [sortDirection, setSortDirection] =
    useState<SortDirection>("oldest");

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState("");

  const [formData, setFormData] =
    useState<CampaignForm>({
      ...emptyForm,
    });

  const [categories, setCategories] = useState<CampaignCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "", order: 0 });
  const [savingCategory, setSavingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const response = await fetch("/api/campaign-categories", { cache: "no-store" });
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch campaign categories:", error);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  function openAddCategory() {
    setEditingCategoryId(null);
    setCategoryForm({ name: "", slug: "", order: 0 });
    setShowCategoryForm(true);
  }

  function openEditCategory(category: CampaignCategory) {
    setEditingCategoryId(category.id);
    setCategoryForm({ name: category.name, slug: category.slug, order: category.order });
    setShowCategoryForm(true);
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!categoryForm.name.trim() || !categoryForm.slug.trim()) {
      alert("Category name and slug are required.");
      return;
    }

    try {
      setSavingCategory(true);

      const response = await fetch("/api/campaign-categories", {
        method: editingCategoryId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingCategoryId ? { id: editingCategoryId, ...categoryForm } : categoryForm
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to save category");
      }

      await fetchCategories();
      setShowCategoryForm(false);
      setEditingCategoryId(null);
    } catch (error) {
      console.error("Save category error:", error);
      alert(error instanceof Error ? error.message : "Failed to save category.");
    } finally {
      setSavingCategory(false);
    }
  }

  async function deleteCategory(category: CampaignCategory) {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;

    try {
      setDeletingCategoryId(category.id);

      const response = await fetch("/api/campaign-categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: category.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to delete category");
      }

      setCategories((current) => current.filter((c) => c.id !== category.id));
    } catch (error) {
      console.error("Delete category error:", error);
      alert(error instanceof Error ? error.message : "Failed to delete category.");
    } finally {
      setDeletingCategoryId(null);
    }
  }

  const [rowStats, setRowStats] =
    useState<Record<string, CampaignRowStats>>({});

  const redirectToLogin = useCallback(() => {
    router.push("/admin/login");
  }, [router]);

  const loadCampaigns = useCallback(
    async () => {
      try {
        setLoading(true);
        setMessage("");

        const response = await fetch(
          "/api/campaigns",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Failed to fetch campaigns"
          );
        }

        setCampaigns(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          "Load campaigns error:",
          error
        );

        setMessage(
          error instanceof Error
            ? error.message
            : "Failed to load campaigns."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );


  const loadCampaignRowData = useCallback(
    async (items: Campaign[]) => {
      try {
        const headers: HeadersInit = {};

        const donationsResponse = await fetch("/api/donations", {
          method: "GET",
          headers,
          cache: "no-store",
        });

        const donationsData = donationsResponse.ok
          ? await donationsResponse.json()
          : [];

        const donations: DonationRecord[] = Array.isArray(donationsData)
          ? donationsData
          : [];

        const nextStats: Record<string, CampaignRowStats> = {};

        await Promise.all(
          items.map(async (campaign) => {
            const campaignDonations = donations.filter((donation) => {
              const id = donation.campaignId || donation.campaign?.id || null;
              return id === campaign.id;
            });

            const successful = campaignDonations.filter(
              (item) => String(item.paymentStatus || "").toUpperCase() === "SUCCESS"
            );

            const failed = campaignDonations.filter((item) =>
              ["FAILED", "FAILURE", "CANCELLED", "CANCELED"].includes(
                String(item.paymentStatus || "").toUpperCase()
              )
            );

            let productTitle = campaign.title;
            try {
              const productsResponse = await fetch(
                `/api/campaign-products?campaignId=${encodeURIComponent(campaign.id)}`,
                { cache: "no-store" }
              );
              if (productsResponse.ok) {
                const productsData = await productsResponse.json();
                if (Array.isArray(productsData) && productsData.length > 0) {
                  productTitle = String(productsData[0]?.name || campaign.title);
                }
              }
            } catch {
              // Product information is optional for the campaign list.
            }

            let updates = 0;
            try {
              const updatesResponse = await fetch(
                `/api/campaign-updates?campaignId=${encodeURIComponent(campaign.id)}`,
                { cache: "no-store" }
              );
              if (updatesResponse.ok) {
                const updatesData = await updatesResponse.json();
                updates = Array.isArray(updatesData) ? updatesData.length : 0;
              }
            } catch {
              // Updates are optional for the list view.
            }

            nextStats[campaign.id] = {
              collected: successful.length
                ? successful.reduce((sum, item) => sum + Number(item.amount || 0), 0)
                : Number(campaign.raisedAmount || 0),
              completed: successful.length,
              failed: failed.reduce((sum, item) => sum + Number(item.amount || 0), 0),
              failedCount: failed.length,
              productTitle,
              updates,
            };
          })
        );

        setRowStats(nextStats);
      } catch (error) {
        console.error("Campaign row data error:", error);
      }
    },
    []
  );

  useEffect(() => {
    void loadCampaigns().then(() => {
      // Load campaign-specific payment/product details after the campaign list is available.
      fetch("/api/campaigns", { cache: "no-store" })
        .then((response) => response.json())
        .then((data) => {
          if (Array.isArray(data)) {
            void loadCampaignRowData(data);
          }
        })
        .catch((error) => console.error("Campaign row data load error:", error));
    });
  }, [
    loadCampaigns,
    loadCampaignRowData,
  ]);

  function openCreate() {
    setEditingId(null);

    setFormData({
      ...emptyForm,
    });

    setMessage("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingId(null);

    setFormData({
      ...emptyForm,
    });

    setMessage("");
  }

  function updateField<
    K extends keyof CampaignForm
  >(
    field: K,
    value: CampaignForm[K]
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function createSlug(
    title: string
  ) {
    return title
      .toLowerCase()
      .trim()
      .replace(
        /[^a-z0-9\s-]/g,
        ""
      )
      .replace(
        /\s+/g,
        "-"
      )
      .replace(
        /-+/g,
        "-"
      );
  }

  function handleTitleChange(
    value: string
  ) {
    setFormData((current) => ({
      ...current,
      title: value,
      slug:
        editingId || current.slug
          ? current.slug
          : createSlug(value),
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");

    if (!formData.title.trim()) {
      setMessage(
        "Campaign title is required."
      );
      return;
    }

    if (!formData.slug.trim()) {
      setMessage(
        "Campaign slug is required."
      );
      return;
    }

    if (
      !formData.summary.trim()
    ) {
      setMessage(
        "Short story is required."
      );
      return;
    }

    if (!formData.story.trim()) {
      setMessage(
        "Full story is required."
      );
      return;
    }

    const goal =
      formData.goalAmount.trim() !== ""
        ? Number(
            formData.goalAmount
          )
        : null;

    const raised =
      formData.raisedAmount.trim() !==
      ""
        ? Number(
            formData.raisedAmount
          )
        : null;

    if (
      goal !== null &&
      (!Number.isFinite(goal) ||
        goal < 0)
    ) {
      setMessage(
        "Goal amount must be a valid positive number."
      );
      return;
    }

    if (
      raised !== null &&
      (!Number.isFinite(raised) ||
        raised < 0)
    ) {
      setMessage(
        "Raised amount must be a valid positive number."
      );
      return;
    }

    try {
      
      setSaving(true);

      const token =
        "cookie-auth";

      const payload = {
        ...(editingId
          ? {
              id: editingId,
            }
          : {}),

        title:
          formData.title.trim(),

        slug:
          formData.slug.trim(),

        summary:
          formData.summary.trim(),

        story:
          formData.story.trim(),

        coverImage:
          formData.coverImage.trim() ||
          null,

        goalAmount: goal,

        raisedAmount: raised,

        startDate:
          formData.startDate
            ? `${formData.startDate}T00:00:00Z`
            : null,

        endDate:
          formData.endDate
            ? `${formData.endDate}T23:59:59Z`
            : null,

        isActive:
          formData.isActive,

        order:
          Number(
            formData.order
          ) || 0,

        status: formData.status,

        categoryId:
          formData.categoryId
            ? Number(formData.categoryId)
            : null,

        videoUrl:
          formData.videoUrl.trim() || null,

        costBreakdown: formData.costBreakdown,

        presetAmounts:
          formData.presetAmounts.trim()
            ? formData.presetAmounts
                .split(",")
                .map((value) => Number(value.trim()))
                .filter((value) => Number.isFinite(value))
            : null,
      };

      const response =
        await fetch(
          "/api/campaigns",
          {
            method: editingId
              ? "PUT"
              : "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify(
              payload
            ),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Failed to save campaign"
        );
      }

      setShowForm(false);
      setEditingId(null);

      setFormData({
        ...emptyForm,
      });

      setMessage(
        editingId
          ? "Campaign updated successfully."
          : "Campaign created successfully."
      );

      await loadCampaigns();
      const refreshed = await fetch("/api/campaigns", { cache: "no-store" });
      if (refreshed.ok) {
        const refreshedData = await refreshed.json();
        if (Array.isArray(refreshedData)) void loadCampaignRowData(refreshedData);
      }
    } catch (error) {
      console.error(
        "Save campaign error:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save campaign."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(
    campaign: Campaign
  ) {
    try {
      
      const token =
        "cookie-auth";

      const response =
        await fetch(
          "/api/campaigns",
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              id: campaign.id,
              title: campaign.title,
              slug: campaign.slug,
              summary:
                campaign.summary,
              story:
                campaign.story,
              coverImage:
                campaign.coverImage,
              goalAmount:
                campaign.goalAmount,
              raisedAmount:
                campaign.raisedAmount,
              startDate:
                campaign.startDate,
              endDate:
                campaign.endDate,
              isActive:
                !campaign.isActive,
              order:
                campaign.order,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Failed to update campaign status"
        );
      }

      setCampaigns(
        (current) =>
          current.map((item) =>
            item.id === campaign.id
              ? {
                  ...item,
                  isActive:
                    !campaign.isActive,
                }
              : item
          )
      );

      setMessage(
        campaign.isActive
          ? "Campaign deactivated successfully."
          : "Campaign activated successfully."
      );
    } catch (error) {
      console.error(
        "Toggle campaign error:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to update campaign status."
      );
    }
  }

  async function deleteCampaign(
    campaign: Campaign
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${campaign.title}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      
      setDeletingId(
        campaign.id
      );

      const token =
        "cookie-auth";

      const response =
        await fetch(
          "/api/campaigns",
          {
            method: "DELETE",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              id: campaign.id,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Failed to delete campaign"
        );
      }

      setCampaigns(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              campaign.id
          )
      );

      setMessage(
        "Campaign deleted successfully."
      );
    } catch (error) {
      console.error(
        "Delete campaign error:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete campaign."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredCampaigns =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      const result =
        campaigns.filter(
          (campaign) => {
            if (!query) {
              return true;
            }

            return (
              campaign.title
                .toLowerCase()
                .includes(query) ||
              campaign.slug
                .toLowerCase()
                .includes(query) ||
              campaign.summary
                .toLowerCase()
                .includes(query) ||
              campaign.story
                .toLowerCase()
                .includes(query)
            );
          }
        );

      return [...result].sort(
        (a, b) => {
          let comparison = 0;

          if (
            sortField ===
            "menuOrder"
          ) {
            comparison =
              a.order -
              b.order;
          }

          if (
            sortField ===
            "title"
          ) {
            comparison =
              a.title.localeCompare(
                b.title
              );
          }

          if (
            sortField ===
            "createdAt"
          ) {
            const aDate =
              a.createdAt
                ? new Date(
                    a.createdAt
                  ).getTime()
                : 0;

            const bDate =
              b.createdAt
                ? new Date(
                    b.createdAt
                  ).getTime()
                : 0;

            comparison =
              aDate - bDate;
          }

          return sortDirection ===
            "oldest"
            ? comparison
            : -comparison;
        }
      );
    }, [
      campaigns,
      search,
      sortField,
      sortDirection,
    ]);

  async function copyCampaignLink(slug: string) {
    const url = `${window.location.origin}/campaigns/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Campaign link copied.");
    } catch {
      setMessage(url);
    }
  }


  return (
    <>
      <main
        style={mainStyle}
      >
        {/* HEADER */}

        <div
          style={
            pageHeaderStyle
          }
        >
          <div>
            <div
              style={
                breadcrumbStyle
              }
            >
              Dashboard /
              Campaigns
            </div>

            <h1
              style={
                pageTitleStyle
              }
            >
              Campaigns
            </h1>

            <p
              style={
                pageDescriptionStyle
              }
            >
              Create and manage campaigns. Add products, project, and updates for each campaign.
            </p>
          </div>

          <button
            type="button"
            onClick={
              openCreate
            }
            style={
              addButtonStyle
            }
          >
            <span
              style={
                addButtonIconStyle
              }
            >
              +
            </span>

            Add
          </button>
        </div>

        {/* MESSAGE */}

        {message && (
          <div
            style={
              messageBarStyle
            }
          >
            <span>
              {message}
            </span>

            <button
              type="button"
              onClick={() =>
                setMessage("")
              }
              style={
                messageCloseStyle
              }
              aria-label="Close message"
            >
              ×
            </button>
          </div>
        )}

        {/* STATS */}

        <section style={statsGridStyle}>
          <StatCard label="Collected" value={formatAmount(statsCollected(campaigns, rowStats))} tone="success" />
          <StatCard label="Failed" value={formatAmount(statsFailed(rowStats))} tone="danger" />
          <StatCard label="Total goal" value={formatAmount(statsGoal(campaigns))} tone="neutral" />
          <StatCard label="Campaigns" value={String(campaigns.length)} tone="neutral" />
        </section>

        {/* SEARCH */}
        <div style={campaignToolbarStyle}>
          <div style={campaignSearchStyle}>
            <span style={searchIconStyle}>⌕</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search campaign, title..."
              style={campaignSearchInputStyle}
              aria-label="Search campaigns"
            />
          </div>
          <select
            value={sortDirection}
            onChange={(event) => setSortDirection(event.target.value as SortDirection)}
            style={campaignSortStyle}
            aria-label="Sort campaigns"
          >
            <option value="oldest">Oldest first</option>
            <option value="newest">Newest first</option>
          </select>
        </div>

        {/* CAMPAIGN TABLE */}
        <section style={referenceTableCardStyle}>
          <div style={referenceTableScrollStyle}>
            <div style={referenceTableHeaderStyle}>
              <div style={{ width: "19%" }}>NAME</div>
              <div style={{ width: "19%" }}>PRODUCTS TITLE</div>
              <div style={{ width: "15%" }}>AMOUNT COLLECTED</div>
              <div style={{ width: "10%" }}>FAILED</div>
              <div style={{ width: "7%" }}>UPDATES</div>
              <div style={{ width: "10%" }}>STATUS</div>
              <div style={{ width: "10%" }}>CREATED</div>
              <div style={{ width: "10%", textAlign: "right" }}>ACTIONS</div>
            </div>

            {loading ? (
              <div style={referenceEmptyStyle}>Loading campaigns...</div>
            ) : filteredCampaigns.length === 0 ? (
              <div style={referenceEmptyStyle}>
                {campaigns.length === 0 ? "No campaigns yet" : "No matching campaigns"}
              </div>
            ) : (
              filteredCampaigns.map((campaign) => {
                const data = rowStats[campaign.id] || {
                  collected: Number(campaign.raisedAmount || 0),
                  completed: 0,
                  failed: 0,
                  failedCount: 0,
                  productTitle: campaign.title,
                  updates: 0,
                };
                const created = campaign.createdAt ? formatDate(campaign.createdAt) : "—";

                return (
                  <div key={campaign.id} style={referenceTableRowStyle}>
                    <div style={{ width: "19%", paddingRight: 14 }}>
                      <div style={referenceNameStyle}>{campaign.title}</div>
                    </div>

                    <div style={{ width: "19%", paddingRight: 14 }}>
                      <div style={referenceProductStyle}>{data.productTitle}</div>
                    </div>

                    <div style={{ width: "15%", paddingRight: 12 }}>
                      <div style={referenceCollectedStyle}>
                        {formatAmount(data.collected)} of<br />
                        {formatAmount(campaign.goalAmount)}
                      </div>
                      <div style={referenceMutedStyle}>{data.completed} completed</div>
                    </div>

                    <div style={{ width: "10%" }}>
                      <div style={referenceFailedStyle}>
                        {data.failed > 0 ? formatAmount(data.failed) : "—"}
                      </div>
                      <div style={referenceMutedStyle}>{data.failedCount} failed</div>
                    </div>

                    <div style={{ width: "7%", color: "#475467", fontSize: 12 }}>{data.updates}</div>

                    <div style={{ width: "10%", display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => toggleStatus(campaign)}
                        style={{
                          ...referenceToggleStyle,
                          background: campaign.isActive ? "#16b957" : "#d6dee8",
                        }}
                        aria-label={campaign.isActive ? "Deactivate campaign" : "Activate campaign"}
                      >
                        <span style={{
                          ...referenceToggleKnobStyle,
                          transform: campaign.isActive ? "translateX(18px)" : "translateX(0)",
                        }} />
                      </button>
                      <span style={{
                        ...referenceStatusBadgeStyle,
                        background: campaign.isActive ? "#eafaf0" : "#fff0f0",
                        color: campaign.isActive ? "#1d7a43" : "#b33a3a",
                      }}>
                        {campaign.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div style={{ width: "10%", color: "#344054", fontSize: 11 }}>
                      {created}
                    </div>

                    <div style={{ width: "10%", display: "flex", justifyContent: "flex-end", gap: 5 }}>
                      <a href={`/campaigns/${campaign.slug}`} target="_blank" rel="noreferrer" style={referenceActionStyle} title="Open campaign">↗</a>
                      <button type="button" onClick={() => copyCampaignLink(campaign.slug)} style={referenceActionStyle} title="Copy link">⧉</button>
                      <button type="button" onClick={() => router.push(`/admin/campaigns/${campaign.id}`)} style={referenceActionStyle} title="Edit campaign">✎</button>
                      <button type="button" onClick={() => deleteCampaign(campaign)} style={referenceDeleteActionStyle} title="Delete campaign">⌫</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <div style={referenceFooterStyle}>
          Showing {filteredCampaigns.length} of {campaigns.length} campaigns
        </div>

        {/* CAMPAIGN CATEGORIES */}

        <section style={{ ...referenceTableCardStyle, marginTop: 30 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#101828" }}>Campaign Categories</h2>
              <p style={{ margin: "4px 0 0", fontSize: 11, color: "#667085" }}>
                Categories campaigns can be filtered by on the public site.
              </p>
            </div>

            <button type="button" onClick={openAddCategory} style={addButtonStyle}>
              + Add Category
            </button>
          </div>

          <div style={referenceTableHeaderStyle}>
            <div style={{ width: "40%" }}>Name</div>
            <div style={{ width: "35%" }}>Slug</div>
            <div style={{ width: "15%" }}>Order</div>
            <div style={{ width: "10%", textAlign: "right" }}>Actions</div>
          </div>

          {categoriesLoading ? (
            <div style={referenceEmptyStyle}>
              <div style={{ fontSize: 12, color: "#667085" }}>Loading categories...</div>
            </div>
          ) : categories.length === 0 ? (
            <div style={referenceEmptyStyle}>
              <div style={{ fontSize: 12, color: "#667085" }}>No categories yet</div>
            </div>
          ) : (
            categories.map((category) => (
              <div key={category.id} style={referenceTableRowStyle}>
                <div style={{ width: "40%" }}>{category.name}</div>
                <div style={{ width: "35%", color: "#667085" }}>{category.slug}</div>
                <div style={{ width: "15%" }}>{category.order}</div>
                <div style={{ width: "10%", display: "flex", justifyContent: "flex-end", gap: 5 }}>
                  <button type="button" onClick={() => openEditCategory(category)} style={referenceActionStyle} title="Edit">✎</button>
                  <button
                    type="button"
                    onClick={() => deleteCategory(category)}
                    disabled={deletingCategoryId === category.id}
                    style={referenceDeleteActionStyle}
                    title="Delete"
                  >
                    {deletingCategoryId === category.id ? "..." : "⌫"}
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {/* CATEGORY MODAL */}

      {showCategoryForm && (
        <div
          style={modalOverlayStyle}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !savingCategory) {
              setShowCategoryForm(false);
            }
          }}
        >
          <div style={{ ...modalStyle, maxWidth: 480 }}>
            <div style={modalHeaderStyle}>
              <h2 style={modalTitleStyle}>
                {editingCategoryId ? "Edit Category" : "Add Category"}
              </h2>

              <button
                type="button"
                onClick={() => setShowCategoryForm(false)}
                disabled={savingCategory}
                style={closeButtonStyle}
              >
                ×
              </button>
            </div>

            <form onSubmit={saveCategory}>
              <div style={modalBodyStyle}>
                <Field label="Name" required>
                  <input
                    value={categoryForm.name}
                    onChange={(event) =>
                      setCategoryForm((f) => ({
                        ...f,
                        name: event.target.value,
                        slug: editingCategoryId
                          ? f.slug
                          : createSlug(event.target.value),
                      }))
                    }
                    style={inputStyle}
                  />
                </Field>

                <Field label="Slug" required>
                  <input
                    value={categoryForm.slug}
                    onChange={(event) =>
                      setCategoryForm((f) => ({ ...f, slug: event.target.value }))
                    }
                    style={inputStyle}
                  />
                </Field>

                <Field label="Order">
                  <input
                    type="number"
                    value={categoryForm.order}
                    onChange={(event) =>
                      setCategoryForm((f) => ({ ...f, order: Number(event.target.value) }))
                    }
                    style={inputStyle}
                  />
                </Field>
              </div>

              <div style={modalFooterStyle}>
                <button
                  type="button"
                  onClick={() => setShowCategoryForm(false)}
                  disabled={savingCategory}
                  style={cancelButtonStyle}
                >
                  Cancel
                </button>

                <button type="submit" disabled={savingCategory} style={saveButtonStyle}>
                  {savingCategory ? "Saving..." : editingCategoryId ? "Save" : "Add Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}

      {showForm && (
        <div
          style={
            modalOverlayStyle
          }
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !saving
            ) {
              closeForm();
            }
          }}
        >
          <div
            style={
              modalStyle
            }
          >
            {/* MODAL HEADER */}

            <div
              style={
                modalHeaderStyle
              }
            >
              <div>
                <div
                  style={
                    modalEyebrowStyle
                  }
                >
                  CAMPAIGN MANAGEMENT
                </div>

                <h2
                  style={
                    modalTitleStyle
                  }
                >
                  {editingId
                    ? "Edit Campaign"
                    : "Add Campaign"}
                </h2>

                <p
                  style={
                    modalSubtitleStyle
                  }
                >
                  Manage the information
                  used by the campaign
                  page.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeForm
                }
                disabled={
                  saving
                }
                style={{
                  ...closeButtonStyle,
                  opacity:
                    saving
                      ? 0.5
                      : 1,
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
            >
              <div
                style={
                  modalBodyStyle
                }
              >
                {message && (
                  <div
                    style={
                      formMessageStyle
                    }
                  >
                    {message}
                  </div>
                )}

                <div
                  style={
                    formGridStyle
                  }
                >
                  <Field
                    label="Campaign Title"
                    required
                  >
                    <input
                      type="text"
                      value={
                        formData.title
                      }
                      onChange={(
                        event
                      ) =>
                        handleTitleChange(
                          event.target
                            .value
                        )
                      }
                      placeholder="Education for Every Child"
                      style={
                        inputStyle
                      }
                    />
                  </Field>

                  <Field
                    label="Slug"
                    required
                  >
                    <input
                      type="text"
                      value={
                        formData.slug
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "slug",
                          event.target.value
                            .toLowerCase()
                            .replace(
                              /[^a-z0-9-\s]/g,
                              ""
                            )
                            .replace(
                              /\s+/g,
                              "-"
                            )
                        )
                      }
                      placeholder="education-for-every-child"
                      style={
                        inputStyle
                      }
                    />

                    <span
                      style={
                        fieldHintStyle
                      }
                    >
                      Public URL:
                      {" "}
                      /campaigns/
                      {formData.slug ||
                        "your-slug"}
                    </span>
                  </Field>
                </div>

                <Field
                  label="Short Description"
                  required
                >
                  <textarea
                    value={
                      formData.summary
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "summary",
                        event.target.value
                      )
                    }
                    placeholder="Short campaign story"
                    rows={3}
                    style={
                      textareaStyle
                    }
                  />
                </Field>

                <Field
                  label="Full Description"
                  required
                  hint="Supports Markdown — use ## for section headings, **text** for bold, - for bullet lists, and > for a highlighted quote."
                >
                  <textarea
                    value={
                      formData.story
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "story",
                        event.target.value
                      )
                    }
                    placeholder={"## About the Campaign\n\nWrite the campaign's story here...\n\n## Our Support Includes\n- Item one\n- Item two"}
                    rows={10}
                    style={
                      textareaStyle
                    }
                  />
                </Field>

                <Field
                  label="Banner Image URL"
                >
                  <input
                    type="url"
                    value={
                      formData.coverImage
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "coverImage",
                        event.target.value
                      )
                    }
                    placeholder="https://example.com/image.jpg"
                    style={
                      inputStyle
                    }
                  />
                </Field>

                {formData.coverImage.trim() && (
                  <Field
                    label="Banner Preview"
                  >
                    <div
                      style={{
                        ...modalPreviewStyle,
                        backgroundImage:
                          `url("${escapeCssUrl(
                            formData.coverImage
                          )}")`,
                      }}
                    />
                  </Field>
                )}

                <div
                  style={
                    formGridStyle
                  }
                >
                  <Field
                    label="Goal Amount"
                  >
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        formData.goalAmount
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "goalAmount",
                          event.target.value
                        )
                      }
                      placeholder="100000"
                      style={
                        inputStyle
                      }
                    />
                  </Field>

                  <Field
                    label="Raised Amount (read-only)"
                  >
                    <input
                      type="number"
                      value={
                        formData.raisedAmount
                      }
                      disabled
                      readOnly
                      placeholder="0"
                      style={{
                        ...inputStyle,
                        background: "#f2f4f7",
                        color: "#667085",
                        cursor: "not-allowed",
                      }}
                    />
                  </Field>

                  <Field
                    label="Start Date"
                  >
                    <input
                      type="date"
                      value={
                        formData.startDate
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "startDate",
                          event.target.value
                        )
                      }
                      style={
                        inputStyle
                      }
                    />
                  </Field>

                  <Field
                    label="End Date"
                  >
                    <input
                      type="date"
                      value={
                        formData.endDate
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "endDate",
                          event.target.value
                        )
                      }
                      style={
                        inputStyle
                      }
                    />
                  </Field>

                  <Field
                    label="Menu Order"
                  >
                    <input
                      type="number"
                      min="0"
                      value={
                        formData.order
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "order",
                          Number(
                            event.target.value
                          )
                        )
                      }
                      style={
                        inputStyle
                      }
                    />
                  </Field>

                  <Field
                    label="Visible on Site"
                  >
                    <div
                      style={
                        statusControlStyle
                      }
                    >
                      <button
                        type="button"
                        onClick={() =>
                          updateField(
                            "isActive",
                            !formData.isActive
                          )
                        }
                        style={{
                          ...toggleStyle,
                          background:
                            formData.isActive
                              ? "#111827"
                              : "#d0d5dd",
                        }}
                        aria-label="Toggle campaign visibility"
                      >
                        <span
                          style={{
                            ...toggleKnobStyle,
                            transform:
                              formData.isActive
                                ? "translateX(18px)"
                                : "translateX(0)",
                          }}
                        />
                      </button>

                      <span
                        style={
                          statusTextStyle
                        }
                      >
                        {formData.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>
                  </Field>

                  <Field label="Campaign Status">
                    <select
                      value={formData.status}
                      onChange={(event) =>
                        updateField(
                          "status",
                          event.target.value as "ACTIVE" | "COMPLETED"
                        )
                      }
                      style={inputStyle}
                    >
                      <option value="ACTIVE">Active (fundraising)</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </Field>

                  <Field label="Category">
                    <select
                      value={formData.categoryId}
                      onChange={(event) =>
                        updateField("categoryId", event.target.value)
                      }
                      style={inputStyle}
                    >
                      <option value="">No category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Video URL">
                    <input
                      value={formData.videoUrl}
                      onChange={(event) =>
                        updateField("videoUrl", event.target.value)
                      }
                      placeholder="https://youtube.com/watch?v=..."
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Preset Donation Amounts (comma-separated)">
                    <input
                      value={formData.presetAmounts}
                      onChange={(event) =>
                        updateField("presetAmounts", event.target.value)
                      }
                      placeholder="1000, 5000, 10000"
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Cost Breakdown">
                    <div style={costBreakdownBoxStyle}>
                      {formData.costBreakdown.map((row, index) => (
                        <div key={index} style={costBreakdownRowStyle}>
                          <input
                            value={row.item}
                            placeholder="Item"
                            onChange={(event) => {
                              const next = [...formData.costBreakdown];
                              next[index] = { ...next[index], item: event.target.value };
                              updateField("costBreakdown", next);
                            }}
                            style={{ ...inputStyle, flex: 2 }}
                          />
                          <input
                            type="number"
                            value={row.qty}
                            placeholder="Qty"
                            onChange={(event) => {
                              const next = [...formData.costBreakdown];
                              next[index] = { ...next[index], qty: Number(event.target.value) };
                              updateField("costBreakdown", next);
                            }}
                            style={{ ...inputStyle, flex: 1 }}
                          />
                          <input
                            type="number"
                            value={row.pricePerUnit}
                            placeholder="Price/unit"
                            onChange={(event) => {
                              const next = [...formData.costBreakdown];
                              next[index] = { ...next[index], pricePerUnit: Number(event.target.value) };
                              updateField("costBreakdown", next);
                            }}
                            style={{ ...inputStyle, flex: 1 }}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateField(
                                "costBreakdown",
                                formData.costBreakdown.filter((_, i) => i !== index)
                              )
                            }
                            style={removeRowButtonStyle}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          updateField("costBreakdown", [
                            ...formData.costBreakdown,
                            { item: "", qty: 0, pricePerUnit: 0 },
                          ])
                        }
                        style={addRowButtonStyle}
                      >
                        + Add Line Item
                      </button>
                    </div>
                  </Field>
                </div>
              </div>

              {/* FOOTER */}

              <div
                style={
                  modalFooterStyle
                }
              >
                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  disabled={
                    saving
                  }
                  style={{
                    ...cancelButtonStyle,
                    opacity:
                      saving
                        ? 0.5
                        : 1,
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  style={{
                    ...saveButtonStyle,
                    opacity:
                      saving
                        ? 0.6
                        : 1,
                  }}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Save Changes"
                    : "Add Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function statsCollected(campaigns: Campaign[], rowStats: Record<string, CampaignRowStats>) {
  return campaigns.reduce((sum, campaign) => sum + (rowStats[campaign.id]?.collected ?? Number(campaign.raisedAmount || 0)), 0);
}

function statsFailed(rowStats: Record<string, CampaignRowStats>) {
  return Object.values(rowStats).reduce((sum, item) => sum + item.failed, 0);
}

function statsGoal(campaigns: Campaign[]) {
  return campaigns.reduce((sum, campaign) => sum + Number(campaign.goalAmount || 0), 0);
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: "success" | "danger" | "neutral" }) {
  const valueColor = tone === "success" ? "#008b67" : tone === "danger" ? "#e22d2d" : "#101828";
  return (
    <div style={referenceStatCardStyle}>
      <div style={{ ...referenceStatValueStyle, color: valueColor }}>{value}</div>
      <div style={referenceStatLabelStyle}>{label}</div>
    </div>
  );
}

/* =========================================
   FIELD
========================================= */

function Field({
  label,
  required = false,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div
      style={
        fieldWrapperStyle
      }
    >
      <label
        style={
          fieldLabelStyle
        }
      >
        {label}

        {required && (
          <span
            style={
              requiredMarkStyle
            }
          >
            *
          </span>
        )}
      </label>

      {hint && (
        <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#667085" }}>{hint}</p>
      )}

      {children}
    </div>
  );
}

/* =========================================
   HELPERS
========================================= */

function formatAmount(
  value: number | null
) {
  if (
    value === null ||
    !Number.isFinite(value)
  ) {
    return "Not set";
  }

  return `₹${value.toLocaleString(
    "en-IN"
  )}`;
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}


function escapeCssUrl(
  value: string
) {
  return value
    .replace(
      /\\/g,
      "\\\\"
    )
    .replace(
      /"/g,
      '\\"'
    );
}

/* =========================================
   MAIN
========================================= */

const mainStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  padding:
    "28px 30px 35px",
  boxSizing: "border-box",
};

const pageHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent:
    "space-between",
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

const pageDescriptionStyle: CSSProperties = {
  margin:
    "5px 0 0",
  maxWidth: "700px",
  fontSize: "11px",
  lineHeight: 1.5,
  color: "#667085",
};

const addButtonStyle: CSSProperties = {
  height: "34px",
  minWidth: "60px",
  border: "none",
  borderRadius: "5px",
  background: "#111827",
  color: "#ffffff",
  padding: "0 15px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
};

const addButtonIconStyle: CSSProperties = {
  fontSize: "15px",
  lineHeight: 1,
};

const messageBarStyle: CSSProperties = {
  minHeight: "36px",
  marginBottom: "12px",
  padding:
    "7px 10px",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent:
    "space-between",
  gap: "10px",
  background: "#ffffff",
  border:
    "1px solid #dbe5f0",
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

/* =========================================
   TOOLBAR
========================================= */



const searchIconStyle: CSSProperties = {
  color: "#98a2b3",
  fontSize: "16px",
  marginRight: "7px",
};



/* =========================================
   REFERENCE CAMPAIGN TABLE
========================================= */

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "14px",
  margin: "22px 0 28px",
};

const referenceStatCardStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "17px 20px",
  minHeight: "104px",
  boxSizing: "border-box",
};

const referenceStatValueStyle: CSSProperties = {
  fontSize: "26px",
  lineHeight: 1.1,
  fontWeight: 800,
  letterSpacing: "-0.5px",
};

const referenceStatLabelStyle: CSSProperties = {
  marginTop: "8px",
  color: "#667085",
  fontSize: "13px",
  fontWeight: 550,
};

const campaignToolbarStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  marginBottom: "12px",
};

const campaignSearchStyle: CSSProperties = {
  flex: 1,
  height: "38px",
  background: "#ffffff",
  border: "1px solid #d8dee8",
  borderRadius: "6px",
  display: "flex",
  alignItems: "center",
  padding: "0 12px",
  boxSizing: "border-box",
};

const campaignSearchInputStyle: CSSProperties = {
  width: "100%",
  border: "none",
  outline: "none",
  background: "transparent",
  color: "#344054",
  fontSize: "12px",
};

const campaignSortStyle: CSSProperties = {
  width: "145px",
  height: "38px",
  border: "1px solid #d8dee8",
  borderRadius: "6px",
  background: "#ffffff",
  color: "#475467",
  padding: "0 10px",
  fontSize: "12px",
};

const referenceTableCardStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #dfe5ec",
  borderRadius: "8px",
  overflow: "hidden",
};

const referenceTableScrollStyle: CSSProperties = {
  minWidth: "1050px",
};

const referenceTableHeaderStyle: CSSProperties = {
  minHeight: "72px",
  display: "flex",
  alignItems: "center",
  padding: "0 17px",
  boxSizing: "border-box",
  background: "#ffffff",
  borderBottom: "1px solid #e4e9ef",
  color: "#344054",
  fontSize: "11px",
  fontWeight: 750,
};

const referenceTableRowStyle: CSSProperties = {
  minHeight: "108px",
  display: "flex",
  alignItems: "center",
  padding: "0 17px",
  boxSizing: "border-box",
  borderBottom: "1px solid #e4e9ef",
};

const referenceNameStyle: CSSProperties = {
  color: "#1d2939",
  fontSize: "13px",
  fontWeight: 650,
  lineHeight: 1.45,
};

const referenceProductStyle: CSSProperties = {
  color: "#1d2939",
  fontSize: "13px",
  fontWeight: 550,
  lineHeight: 1.45,
  paddingRight: "8px",
};

const referenceCollectedStyle: CSSProperties = {
  color: "#008b67",
  fontSize: "12px",
  fontWeight: 750,
  lineHeight: 1.55,
};

const referenceFailedStyle: CSSProperties = {
  color: "#e22d2d",
  fontSize: "12px",
  fontWeight: 750,
  lineHeight: 1.55,
};

const referenceMutedStyle: CSSProperties = {
  marginTop: "2px",
  color: "#667085",
  fontSize: "11px",
};

const referenceToggleStyle: CSSProperties = {
  width: "44px",
  height: "24px",
  padding: "3px",
  border: "none",
  borderRadius: "20px",
  cursor: "pointer",
  boxSizing: "border-box",
};

const referenceToggleKnobStyle: CSSProperties = {
  display: "block",
  width: "18px",
  height: "18px",
  borderRadius: "50%",
  background: "#ffffff",
  transition: "transform 160ms ease",
};

const referenceStatusBadgeStyle: CSSProperties = {
  borderRadius: "999px",
  padding: "5px 9px",
  fontSize: "10px",
  fontWeight: 700,
};

const referenceActionStyle: CSSProperties = {
  width: "35px",
  height: "35px",
  border: "1px solid #d9e0e8",
  borderRadius: "5px",
  background: "#ffffff",
  color: "#667085",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  fontSize: "15px",
  cursor: "pointer",
  boxSizing: "border-box",
};

const referenceDeleteActionStyle: CSSProperties = {
  ...referenceActionStyle,
  color: "#667085",
};

const referenceEmptyStyle: CSSProperties = {
  minHeight: "180px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#667085",
  fontSize: "13px",
};

const referenceFooterStyle: CSSProperties = {
  padding: "10px 0",
  color: "#667085",
  fontSize: "11px",
};

const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  background:
    "rgba(15,23,42,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
};

const modalStyle: CSSProperties = {
  width: "100%",
  maxWidth: "820px",
  maxHeight: "92vh",
  overflowY: "auto",
  background: "#ffffff",
  borderRadius: "9px",
  border:
    "1px solid #e5e7eb",
  boxShadow:
    "0 20px 60px rgba(15,23,42,0.18)",
};

const modalHeaderStyle: CSSProperties = {
  padding:
    "18px 20px",
  borderBottom:
    "1px solid #eaecf0",
  display: "flex",
  justifyContent:
    "space-between",
  alignItems:
    "flex-start",
  gap: "15px",
};

const modalEyebrowStyle: CSSProperties = {
  fontSize: "8px",
  fontWeight: 800,
  letterSpacing: "0.8px",
  color: "#2563eb",
  marginBottom: "5px",
};

const modalTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "17px",
  fontWeight: 750,
  color: "#101828",
};

const modalSubtitleStyle: CSSProperties = {
  margin:
    "4px 0 0",
  fontSize: "9px",
  color: "#98a2b3",
};

const closeButtonStyle: CSSProperties = {
  width: "29px",
  height: "29px",
  border: "none",
  borderRadius: "5px",
  background: "#f2f4f7",
  color: "#667085",
  fontSize: "18px",
  cursor: "pointer",
};

const modalBodyStyle: CSSProperties = {
  padding:
    "19px 20px",
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "1fr 1fr",
  gap: "13px",
};

const fieldWrapperStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  marginBottom: "14px",
};

const fieldLabelStyle: CSSProperties = {
  fontSize: "9px",
  fontWeight: 700,
  color: "#344054",
};

const requiredMarkStyle: CSSProperties = {
  marginLeft: "3px",
  color: "#dc2626",
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: "37px",
  boxSizing: "border-box",
  border:
    "1px solid #d0d5dd",
  borderRadius: "5px",
  padding: "0 10px",
  outline: "none",
  color: "#344054",
  background: "#ffffff",
  fontSize: "10px",
};

const costBreakdownBoxStyle: CSSProperties = {
  border: "1px solid #e4e7ec",
  borderRadius: "8px",
  padding: "10px",
  background: "#f8fafc",
};

const costBreakdownRowStyle: CSSProperties = {
  display: "flex",
  gap: "6px",
  marginBottom: "8px",
  alignItems: "center",
};

const removeRowButtonStyle: CSSProperties = {
  height: "32px",
  padding: "0 10px",
  border: "1px solid #fecdca",
  borderRadius: "5px",
  background: "#fff5f4",
  color: "#b42318",
  fontSize: "10px",
  cursor: "pointer",
};

const addRowButtonStyle: CSSProperties = {
  height: "32px",
  padding: "0 12px",
  border: "1px dashed #94a3b8",
  borderRadius: "5px",
  background: "transparent",
  color: "#475467",
  fontSize: "10px",
  cursor: "pointer",
};

const textareaStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border:
    "1px solid #d0d5dd",
  borderRadius: "5px",
  padding: "9px 10px",
  outline: "none",
  color: "#344054",
  background: "#ffffff",
  fontSize: "10px",
  lineHeight: 1.5,
  resize: "vertical",
};

const fieldHintStyle: CSSProperties = {
  color: "#98a2b3",
  fontSize: "8px",
  lineHeight: 1.4,
};

const modalPreviewStyle: CSSProperties = {
  width: "100%",
  height: "145px",
  borderRadius: "6px",
  backgroundColor: "#eef1f3",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  border:
    "1px solid #e5e7eb",
};

const statusControlStyle: CSSProperties = {
  minHeight: "37px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const toggleStyle: CSSProperties = {
  width: "42px",
  height: "24px",
  padding: "3px",
  border: "none",
  borderRadius: "20px",
  cursor: "pointer",
};

const toggleKnobStyle: CSSProperties = {
  display: "block",
  width: "18px",
  height: "18px",
  borderRadius: "50%",
  background: "#ffffff",
  transition:
    "transform 0.2s",
};

const statusTextStyle: CSSProperties = {
  fontSize: "10px",
  color: "#667085",
};

const formMessageStyle: CSSProperties = {
  marginBottom: "14px",
  padding: "9px 11px",
  borderRadius: "5px",
  background: "#fef2f2",
  border:
    "1px solid #fecaca",
  color: "#dc2626",
  fontSize: "9px",
};

const modalFooterStyle: CSSProperties = {
  padding:
    "12px 20px",
  borderTop:
    "1px solid #eaecf0",
  background: "#fafbfc",
  display: "flex",
  justifyContent:
    "flex-end",
  gap: "8px",
};

const cancelButtonStyle: CSSProperties = {
  height: "34px",
  padding: "0 14px",
  border:
    "1px solid #d0d5dd",
  borderRadius: "5px",
  background: "#ffffff",
  color: "#475467",
  cursor: "pointer",
  fontSize: "9px",
  fontWeight: 650,
};

const saveButtonStyle: CSSProperties = {
  height: "34px",
  padding: "0 15px",
  border: "none",
  borderRadius: "5px",
  background: "#111827",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: "9px",
  fontWeight: 700,
};