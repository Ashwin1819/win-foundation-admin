"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";

type HeroSlide = {
  id: number;
  headline: string;
  subtext: string | null;
  image: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type HeroForm = {
  headline: string;
  subtext: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  order: string;
  isActive: boolean;
};

const emptyHeroForm: HeroForm = {
  headline: "",
  subtext: "",
  image: "",
  ctaText: "",
  ctaLink: "",
  order: "0",
  isActive: true,
};

type Quote = {
  id: number;
  text: string;
  order: number;
  isActive: boolean;
};

type QuoteForm = {
  text: string;
  order: string;
  isActive: boolean;
};

const emptyQuoteForm: QuoteForm = {
  text: "",
  order: "0",
  isActive: true,
};

type PresenceLocation = {
  id: number;
  name: string;
  left: string;
  top: string;
  order: number;
  isActive: boolean;
};

type PresenceLocationForm = {
  name: string;
  left: string;
  top: string;
  order: string;
  isActive: boolean;
};

const emptyPresenceForm: PresenceLocationForm = {
  name: "",
  left: "50%",
  top: "50%",
  order: "0",
  isActive: true,
};

export default function HomeSettingsPage() {
  const router = useRouter();

  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);

  const [loading, setLoading] = useState(true);

  const [savingHero, setSavingHero] = useState(false);

  const [deletingHeroId, setDeletingHeroId] =
    useState<number | null>(null);

  const [heroModal, setHeroModal] = useState(false);

  const [editingHero, setEditingHero] =
    useState<HeroSlide | null>(null);

  const [heroForm, setHeroForm] =
    useState<HeroForm>(emptyHeroForm);

  const [heroSearch, setHeroSearch] = useState("");

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [savingQuote, setSavingQuote] = useState(false);
  const [deletingQuoteId, setDeletingQuoteId] = useState<number | null>(null);
  const [quoteModal, setQuoteModal] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [quoteForm, setQuoteForm] = useState<QuoteForm>(emptyQuoteForm);

  const [giForm, setGiForm] = useState({
    giImage: "",
    giPillText: "",
    giPillLink: "",
    giHeading: "",
    giText: "",
    giPrimaryText: "",
    giPrimaryLink: "",
    giSecondaryText: "",
    giSecondaryLink: "",
  });
  const [giLoaded, setGiLoaded] = useState(false);
  const [giSaving, setGiSaving] = useState(false);

  const [missionForm, setMissionForm] = useState({
    missionImage: "",
    missionEyebrow: "",
    missionHeading: "",
    missionText: "",
    missionButtonText: "",
    missionButtonLink: "",
    missionTeamLabel: "",
  });
  const [missionLoaded, setMissionLoaded] = useState(false);
  const [missionSaving, setMissionSaving] = useState(false);

  const [presenceForm, setPresenceForm] = useState({
    presenceMapImage: "",
    presenceEyebrow: "",
    presenceHeading: "",
    presenceText1: "",
    presenceText2: "",
  });
  const [presenceLoaded, setPresenceLoaded] = useState(false);
  const [presenceSaving, setPresenceSaving] = useState(false);
  const [presenceMapUploading, setPresenceMapUploading] = useState(false);

  const [presenceLocations, setPresenceLocations] = useState<PresenceLocation[]>([]);
  const [savingPresenceLocation, setSavingPresenceLocation] = useState(false);
  const [deletingPresenceLocationId, setDeletingPresenceLocationId] = useState<number | null>(null);
  const [presenceLocationModal, setPresenceLocationModal] = useState(false);
  const [editingPresenceLocation, setEditingPresenceLocation] = useState<PresenceLocation | null>(null);
  const [presenceLocationForm, setPresenceLocationForm] = useState<PresenceLocationForm>(emptyPresenceForm);

  /* =========================================================
     LOGIN
  ========================================================= */

  const redirectToLogin = useCallback(() => {
    router.push("/admin/login");
  }, [router]);

  /* =========================================================
     FETCH HERO SLIDES
  ========================================================= */

  const fetchHeroSlides = useCallback(async () => {
    try {
      const response = await fetch("/api/hero-slides", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load hero slides"
        );
      }

      setHeroSlides(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Hero slides fetch error:", error);
      alert("Failed to load hero slides");
    }
  }, []);

  /* =========================================================
     FETCH QUOTES
  ========================================================= */

  const fetchQuotes = useCallback(async () => {
    try {
      const response = await fetch("/api/quotes", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load quotes");
      }

      setQuotes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Quotes fetch error:", error);
      alert("Failed to load quotes");
    }
  }, []);

  /* =========================================================
     FETCH HOMEPAGE CONTENT (Get Involved banner + Mission section)
  ========================================================= */

  const fetchHomepageContent = useCallback(async () => {
    try {
      const response = await fetch("/api/homepage-content", { cache: "no-store" });
      const data = await response.json();

      if (response.ok) {
        setGiForm({
          giImage: data.giImage || "",
          giPillText: data.giPillText || "",
          giPillLink: data.giPillLink || "",
          giHeading: data.giHeading || "",
          giText: data.giText || "",
          giPrimaryText: data.giPrimaryText || "",
          giPrimaryLink: data.giPrimaryLink || "",
          giSecondaryText: data.giSecondaryText || "",
          giSecondaryLink: data.giSecondaryLink || "",
        });
        setMissionForm({
          missionImage: data.missionImage || "",
          missionEyebrow: data.missionEyebrow || "",
          missionHeading: data.missionHeading || "",
          missionText: data.missionText || "",
          missionButtonText: data.missionButtonText || "",
          missionButtonLink: data.missionButtonLink || "",
          missionTeamLabel: data.missionTeamLabel || "",
        });
        setPresenceForm({
          presenceMapImage: data.presenceMapImage || "",
          presenceEyebrow: data.presenceEyebrow || "",
          presenceHeading: data.presenceHeading || "",
          presenceText1: data.presenceText1 || "",
          presenceText2: data.presenceText2 || "",
        });
      }
    } catch (error) {
      console.error("Homepage content fetch error:", error);
    } finally {
      setGiLoaded(true);
      setMissionLoaded(true);
      setPresenceLoaded(true);
    }
  }, []);

  async function saveGetInvolved() {
    try {
      setGiSaving(true);
      const response = await fetch("/api/homepage-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(giForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to save");
      alert("Get Involved banner saved.");
    } catch (error) {
      console.error("Save Get Involved error:", error);
      alert(error instanceof Error ? error.message : "Failed to save.");
    } finally {
      setGiSaving(false);
    }
  }

  async function saveMission() {
    try {
      setMissionSaving(true);
      const response = await fetch("/api/homepage-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(missionForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to save");
      alert("Mission section saved.");
    } catch (error) {
      console.error("Save Mission error:", error);
      alert(error instanceof Error ? error.message : "Failed to save.");
    } finally {
      setMissionSaving(false);
    }
  }

  async function savePresenceSection() {
    try {
      setPresenceSaving(true);
      const response = await fetch("/api/homepage-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(presenceForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to save");
      alert("Working Locations section saved.");
    } catch (error) {
      console.error("Save Working Locations error:", error);
      alert(error instanceof Error ? error.message : "Failed to save.");
    } finally {
      setPresenceSaving(false);
    }
  }

  async function handlePresenceMapUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be smaller than 10MB.");
      return;
    }

    try {
      setPresenceMapUploading(true);
      const formData = new FormData();
      formData.append("files", file);

      const response = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to upload image");

      const uploaded = Array.isArray(data) ? data[0] : null;
      if (!uploaded?.imageUrl) throw new Error("Upload did not return an image URL");

      setPresenceForm((f) => ({ ...f, presenceMapImage: uploaded.imageUrl }));
    } catch (error) {
      console.error("Upload map image error:", error);
      alert(error instanceof Error ? error.message : "Failed to upload image.");
    } finally {
      setPresenceMapUploading(false);
    }
  }

  /* =========================================================
     FETCH PRESENCE LOCATIONS
  ========================================================= */

  const fetchPresenceLocations = useCallback(async () => {
    try {
      const response = await fetch("/api/presence-locations", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load presence locations");
      }

      setPresenceLocations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Presence locations fetch error:", error);
      alert("Failed to load presence locations");
    }
  }, []);

  const sortedPresenceLocations = useMemo(
    () => [...presenceLocations].sort((a, b) => a.order - b.order),
    [presenceLocations]
  );

  function openAddPresenceLocation() {
    setEditingPresenceLocation(null);
    setPresenceLocationForm({ ...emptyPresenceForm, order: String(presenceLocations.length + 1) });
    setPresenceLocationModal(true);
  }

  function openEditPresenceLocation(location: PresenceLocation) {
    setEditingPresenceLocation(location);
    setPresenceLocationForm({
      name: location.name,
      left: location.left,
      top: location.top,
      order: String(location.order),
      isActive: location.isActive,
    });
    setPresenceLocationModal(true);
  }

  function closePresenceLocationModal() {
    if (savingPresenceLocation) return;
    setPresenceLocationModal(false);
    setEditingPresenceLocation(null);
    setPresenceLocationForm(emptyPresenceForm);
  }

  function updatePresenceLocationField(field: keyof PresenceLocationForm, value: string | boolean) {
    setPresenceLocationForm((current) => ({ ...current, [field]: value }));
  }

  async function handlePresenceLocationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!presenceLocationForm.name.trim()) {
      alert("Location name is required.");
      return;
    }

    try {
      setSavingPresenceLocation(true);

      const response = await fetch("/api/presence-locations", {
        method: editingPresenceLocation ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingPresenceLocation ? { id: editingPresenceLocation.id } : {}),
          name: presenceLocationForm.name.trim(),
          left: presenceLocationForm.left.trim(),
          top: presenceLocationForm.top.trim(),
          order: Number(presenceLocationForm.order) || 0,
          isActive: presenceLocationForm.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save location");
      }

      if (editingPresenceLocation) {
        setPresenceLocations((current) =>
          current.map((item) => (item.id === editingPresenceLocation.id ? data : item))
        );
      } else {
        setPresenceLocations((current) => [...current, data]);
      }

      closePresenceLocationModal();
    } catch (error) {
      console.error("Save presence location error:", error);
      alert(error instanceof Error ? error.message : "Failed to save location");
    } finally {
      setSavingPresenceLocation(false);
    }
  }

  async function deletePresenceLocation(location: PresenceLocation) {
    if (!window.confirm(`Delete "${location.name}"?`)) return;

    try {
      setDeletingPresenceLocationId(location.id);

      const response = await fetch("/api/presence-locations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: location.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete location");
      }

      setPresenceLocations((current) => current.filter((item) => item.id !== location.id));
    } catch (error) {
      console.error("Delete presence location error:", error);
      alert(error instanceof Error ? error.message : "Failed to delete location");
    } finally {
      setDeletingPresenceLocationId(null);
    }
  }

  async function togglePresenceLocationStatus(location: PresenceLocation) {
    try {
      const response = await fetch("/api/presence-locations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: location.id, isActive: !location.isActive }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      setPresenceLocations((current) =>
        current.map((item) => (item.id === location.id ? data : item))
      );
    } catch (error) {
      console.error("Toggle presence location error:", error);
      alert(error instanceof Error ? error.message : "Failed to update status");
    }
  }

  /* =========================================================
     AUTH + LOAD
  ========================================================= */

  useEffect(() => {
    async function load() {
      try {
        await Promise.all([
          fetchHeroSlides(),
          fetchQuotes(),
          fetchHomepageContent(),
          fetchPresenceLocations(),
        ]);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [fetchHeroSlides, fetchQuotes, fetchHomepageContent, fetchPresenceLocations]);

  /* =========================================================
     FILTER HERO
  ========================================================= */

  const filteredHeroSlides = useMemo(() => {
    const search = heroSearch.trim().toLowerCase();

    return [...heroSlides]
      .filter((slide) => {
        if (!search) return true;

        return (
          slide.headline.toLowerCase().includes(search) ||
          (slide.subtext || "")
            .toLowerCase()
            .includes(search) ||
          (slide.ctaText || "")
            .toLowerCase()
            .includes(search)
        );
      })
      .sort(
        (a, b) => a.order - b.order
      );
  }, [heroSlides, heroSearch]);

  /* =========================================================
     HERO MODAL
  ========================================================= */

  function openAddHero() {
    setEditingHero(null);
    setHeroForm({ ...emptyHeroForm });
    setHeroModal(true);
  }

  function openEditHero(slide: HeroSlide) {
    setEditingHero(slide);

    setHeroForm({
      headline: slide.headline,
      subtext: slide.subtext || "",
      image: slide.image || "",
      ctaText: slide.ctaText || "",
      ctaLink: slide.ctaLink || "",
      order: String(slide.order),
      isActive: slide.isActive,
    });

    setHeroModal(true);
  }

  function closeHeroModal() {
    if (savingHero) return;

    setHeroModal(false);
    setEditingHero(null);
    setHeroForm({ ...emptyHeroForm });
  }

  function updateHeroField(
    field: keyof HeroForm,
    value: string | boolean
  ) {
    setHeroForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /* =========================================================
     SAVE HERO
  ========================================================= */

  async function handleHeroSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!heroForm.headline.trim()) {
      alert("Hero title is required.");
      return;
    }

    try {
      
      setSavingHero(true);

      const token = "cookie-auth";

      const response = await fetch("/api/hero-slides", {
        method: editingHero ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...(editingHero
            ? { id: editingHero.id }
            : {}),
          headline: heroForm.headline.trim(),
          subtext: heroForm.subtext.trim(),
          image: heroForm.image.trim(),
          ctaText: heroForm.ctaText.trim(),
          ctaLink: heroForm.ctaLink.trim(),
          order:
            Number(heroForm.order) || 0,
          isActive: heroForm.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to save hero slide"
        );
      }

      if (editingHero) {
        setHeroSlides((current) =>
          current.map((slide) =>
            slide.id === editingHero.id
              ? data
              : slide
          )
        );
      } else {
        setHeroSlides((current) => [
          ...current,
          data,
        ]);
      }

      closeHeroModal();
    } catch (error) {
      console.error("Save hero slide error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save hero slide"
      );
    } finally {
      setSavingHero(false);
    }
  }

  /* =========================================================
     DELETE HERO
  ========================================================= */

  async function deleteHero(slide: HeroSlide) {
    if (
      !window.confirm(
        `Delete "${slide.headline}"?`
      )
    ) {
      return;
    }

    try {

      setDeletingHeroId(slide.id);

      const token = "cookie-auth";

      const response = await fetch(
        "/api/hero-slides",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ id: slide.id }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to delete hero slide"
        );
      }

      setHeroSlides((current) =>
        current.filter(
          (item) => item.id !== slide.id
        )
      );
    } catch (error) {
      console.error(
        "Delete hero slide error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete hero slide"
      );
    } finally {
      setDeletingHeroId(null);
    }
  }

  /* =========================================================
     TOGGLE HERO
  ========================================================= */

  async function toggleHeroStatus(
    slide: HeroSlide
  ) {
    try {
      
      const token = "cookie-auth";

      const response = await fetch(
        "/api/hero-slides",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: slide.id,
            isActive: !slide.isActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update hero status"
        );
      }

      setHeroSlides((current) =>
        current.map((item) =>
          item.id === slide.id
            ? data
            : item
        )
      );
    } catch (error) {
      console.error(
        "Toggle hero status error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to update hero status"
      );
    }
  }

  /* =========================================================
     QUOTES
  ========================================================= */

  const sortedQuotes = useMemo(
    () => [...quotes].sort((a, b) => a.order - b.order),
    [quotes]
  );

  function openAddQuote() {
    setEditingQuote(null);
    setQuoteForm({ ...emptyQuoteForm, order: String(quotes.length + 1) });
    setQuoteModal(true);
  }

  function openEditQuote(quote: Quote) {
    setEditingQuote(quote);
    setQuoteForm({
      text: quote.text,
      order: String(quote.order),
      isActive: quote.isActive,
    });
    setQuoteModal(true);
  }

  function closeQuoteModal() {
    if (savingQuote) return;
    setQuoteModal(false);
    setEditingQuote(null);
    setQuoteForm(emptyQuoteForm);
  }

  function updateQuoteField(field: keyof QuoteForm, value: string | boolean) {
    setQuoteForm((current) => ({ ...current, [field]: value }));
  }

  async function handleQuoteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!quoteForm.text.trim()) {
      alert("Quote text is required.");
      return;
    }

    try {
      setSavingQuote(true);
      const token = "cookie-auth";

      const response = await fetch("/api/quotes", {
        method: editingQuote ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...(editingQuote ? { id: editingQuote.id } : {}),
          text: quoteForm.text.trim(),
          order: Number(quoteForm.order) || 0,
          isActive: quoteForm.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save quote");
      }

      if (editingQuote) {
        setQuotes((current) =>
          current.map((item) => (item.id === editingQuote.id ? data : item))
        );
      } else {
        setQuotes((current) => [...current, data]);
      }

      closeQuoteModal();
    } catch (error) {
      console.error("Save quote error:", error);
      alert(error instanceof Error ? error.message : "Failed to save quote");
    } finally {
      setSavingQuote(false);
    }
  }

  async function deleteQuote(quote: Quote) {
    if (!window.confirm("Delete this quote?")) return;

    try {
      setDeletingQuoteId(quote.id);
      const token = "cookie-auth";

      const response = await fetch("/api/quotes", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: quote.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete quote");
      }

      setQuotes((current) => current.filter((item) => item.id !== quote.id));
    } catch (error) {
      console.error("Delete quote error:", error);
      alert(error instanceof Error ? error.message : "Failed to delete quote");
    } finally {
      setDeletingQuoteId(null);
    }
  }

  async function toggleQuoteStatus(quote: Quote) {
    try {
      const token = "cookie-auth";

      const response = await fetch("/api/quotes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: quote.id, isActive: !quote.isActive }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update quote status");
      }

      setQuotes((current) =>
        current.map((item) => (item.id === quote.id ? data : item))
      );
    } catch (error) {
      console.error("Toggle quote status error:", error);
      alert(error instanceof Error ? error.message : "Failed to update quote status");
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div style={loadingPageStyle}>
        <div style={loadingBoxStyle}>
          <div style={loadingSpinnerStyle}>
            ⟳
          </div>

          <div style={loadingTitleStyle}>
            Loading Homepage
          </div>

          <div style={loadingTextStyle}>
            Please wait...
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div style={pageStyle}>
      <main style={mainStyle}>

        {/* HEADER */}

        <div style={headerStyle}>
          <div>
            <div style={breadcrumbStyle}>
              Dashboard / Homepage
            </div>

            <h1 style={titleStyle}>
              Homepage
            </h1>

            <p style={descriptionStyle}>
              Manage your website homepage content.
            </p>
          </div>
        </div>

        {/* =================================================
            HERO SECTION
        ================================================= */}

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>
                Hero Slides
              </h2>

              <p style={sectionDescriptionStyle}>
                Manage the main banner slides displayed
                at the top of your website.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddHero}
              style={primaryButtonStyle}
            >
              + Add Hero Slide
            </button>
          </div>

          <div style={toolbarStyle}>
            <div style={searchWrapperStyle}>
              <span style={searchIconStyle}>
                ⌕
              </span>

              <input
                type="text"
                value={heroSearch}
                onChange={(event) =>
                  setHeroSearch(event.target.value)
                }
                placeholder="Search hero slides..."
                style={searchInputStyle}
              />
            </div>
          </div>

          <div style={cardStyle}>
            <div style={heroHeaderRowStyle}>
              <div style={{ width: "8%" }}>
                ORDER
              </div>

              <div style={{ width: "17%" }}>
                IMAGE
              </div>

              <div style={{ width: "22%" }}>
                TITLE
              </div>

              <div style={{ width: "20%" }}>
                SUBTITLE
              </div>

              <div style={{ width: "13%" }}>
                BUTTON
              </div>

              <div style={{ width: "10%" }}>
                STATUS
              </div>

              <div
                style={{
                  width: "10%",
                  textAlign: "right",
                }}
              >
                ACTIONS
              </div>
            </div>

            {filteredHeroSlides.length === 0 ? (
              <div style={emptyStyle}>
                <div style={emptyIconStyle}>
                  ▦
                </div>

                <div style={emptyTitleStyle}>
                  {heroSlides.length === 0
                    ? "No hero slides found"
                    : "No matching hero slides"}
                </div>

                <div style={emptyTextStyle}>
                  {heroSlides.length === 0
                    ? "Add your first hero slide to display a banner on the website."
                    : "Try changing your search."}
                </div>

                {heroSlides.length === 0 && (
                  <button
                    type="button"
                    onClick={openAddHero}
                    style={primaryButtonStyle}
                  >
                    + Add Hero Slide
                  </button>
                )}
              </div>
            ) : (
              filteredHeroSlides.map((slide) => (
                <div
                  key={slide.id}
                  style={heroRowStyle}
                >
                  <div style={{ width: "8%" }}>
                    <span style={orderBadgeStyle}>
                      {slide.order}
                    </span>
                  </div>

                  <div style={{ width: "17%" }}>
                    <div
                      style={{
                        ...heroImageStyle,
                        backgroundImage:
                          slide.image
                            ? `url("${escapeCssUrl(
                                resolveImageUrl(slide.image)
                              )}")`
                            : undefined,
                      }}
                    >
                      {!slide.image && (
                        <span style={noImageStyle}>
                          No image
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      width: "22%",
                      paddingRight: "12px",
                    }}
                  >
                    <div style={rowTitleStyle}>
                      {slide.headline}
                    </div>

                    {slide.ctaLink && (
                      <div style={smallTextStyle}>
                        {slide.ctaLink}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      width: "20%",
                      paddingRight: "12px",
                    }}
                  >
                    <div style={rowTextStyle}>
                      {slide.subtext || "—"}
                    </div>
                  </div>

                  <div style={{ width: "13%" }}>
                    {slide.ctaText ? (
                      <span
                        style={buttonPreviewStyle}
                      >
                        {slide.ctaText}
                      </span>
                    ) : (
                      <span style={mutedStyle}>
                        —
                      </span>
                    )}
                  </div>

                  <div style={{ width: "10%" }}>
                    <button
                      type="button"
                      onClick={() =>
                        toggleHeroStatus(slide)
                      }
                      style={{
                        ...statusBadgeStyle,
                        ...(slide.isActive
                          ? activeStatusStyle
                          : inactiveStatusStyle),
                      }}
                    >
                      {slide.isActive
                        ? "Active"
                        : "Inactive"}
                    </button>
                  </div>

                  <div
                    style={{
                      width: "10%",
                      display: "flex",
                      justifyContent:
                        "flex-end",
                      gap: "6px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        openEditHero(slide)
                      }
                      style={editButtonStyle}
                      title="Edit"
                    >
                      ✎
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteHero(slide)
                      }
                      disabled={
                        deletingHeroId === slide.id
                      }
                      style={{
                        ...deleteButtonStyle,
                        opacity:
                          deletingHeroId ===
                          slide.id
                            ? 0.5
                            : 1,
                      }}
                      title="Delete"
                    >
                      {deletingHeroId === slide.id
                        ? "..."
                        : "🗑"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={footerStyle}>
            Showing {filteredHeroSlides.length} of{" "}
            {heroSlides.length} hero slides
          </div>
        </section>

        {/* =================================================
            MISSION QUOTES
        ================================================= */}

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>
                Mission Quotes
              </h2>

              <p style={sectionDescriptionStyle}>
                Manage the rotating quote shown on the homepage over the mission photo.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddQuote}
              style={primaryButtonStyle}
            >
              + Add Quote
            </button>
          </div>

          <div>
            {sortedQuotes.length === 0 ? (
              <div style={emptyStyle}>
                <div style={emptyIconStyle}>❝</div>
                <div style={emptyTitleStyle}>No quotes found</div>
                <div style={emptyTextStyle}>
                  Add your first quote to show it on the homepage.
                </div>
              </div>
            ) : (
              sortedQuotes.map((quote) => (
                <div key={quote.id} style={heroRowStyle}>
                  <div style={{ width: "8%" }}>
                    <span style={orderBadgeStyle}>
                      {quote.order}
                    </span>
                  </div>

                  <div style={{ width: "62%", paddingRight: "12px" }}>
                    <div style={rowTextStyle}>
                      {quote.text}
                    </div>
                  </div>

                  <div style={{ width: "10%" }}>
                    <button
                      type="button"
                      onClick={() => void toggleQuoteStatus(quote)}
                      style={{
                        ...statusBadgeStyle,
                        ...(quote.isActive
                          ? activeStatusStyle
                          : inactiveStatusStyle),
                      }}
                    >
                      {quote.isActive ? "Active" : "Inactive"}
                    </button>
                  </div>

                  <div style={{ width: "20%", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => openEditQuote(quote)}
                      style={editButtonStyle}
                      title="Edit"
                    >
                      ✎
                    </button>

                    <button
                      type="button"
                      onClick={() => void deleteQuote(quote)}
                      disabled={deletingQuoteId === quote.id}
                      style={{
                        ...deleteButtonStyle,
                        opacity: deletingQuoteId === quote.id ? 0.5 : 1,
                      }}
                      title="Delete"
                    >
                      {deletingQuoteId === quote.id ? "..." : "🗑"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={footerStyle}>
            Showing {sortedQuotes.length} quote{sortedQuotes.length !== 1 ? "s" : ""}
          </div>
        </section>

        {/* =================================================
            GET INVOLVED BANNER
        ================================================= */}

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>
                Get Involved Banner
              </h2>

              <p style={sectionDescriptionStyle}>
                The full-width photo banner on the homepage, between the map and mission sections.
              </p>
            </div>
          </div>

          <div style={contentFormGridStyle}>
            <div style={fullFieldStyle}>
              <label style={labelStyle}>Background Image URL</label>
              <input
                value={giForm.giImage}
                onChange={(e) => setGiForm((f) => ({ ...f, giImage: e.target.value }))}
                disabled={!giLoaded}
                placeholder="https://..."
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Pill Text</label>
              <input
                value={giForm.giPillText}
                onChange={(e) => setGiForm((f) => ({ ...f, giPillText: e.target.value }))}
                disabled={!giLoaded}
                placeholder="GET INVOLVED NOW"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Pill Link</label>
              <input
                value={giForm.giPillLink}
                onChange={(e) => setGiForm((f) => ({ ...f, giPillLink: e.target.value }))}
                disabled={!giLoaded}
                placeholder="/volunteer"
                style={inputStyle}
              />
            </div>

            <div style={fullFieldStyle}>
              <label style={labelStyle}>Heading</label>
              <input
                value={giForm.giHeading}
                onChange={(e) => setGiForm((f) => ({ ...f, giHeading: e.target.value }))}
                disabled={!giLoaded}
                placeholder="Standing By Communities When It Matters Most"
                style={inputStyle}
              />
            </div>

            <div style={fullFieldStyle}>
              <label style={labelStyle}>Paragraph Text</label>
              <textarea
                value={giForm.giText}
                onChange={(e) => setGiForm((f) => ({ ...f, giText: e.target.value }))}
                disabled={!giLoaded}
                rows={3}
                style={{ ...textareaStyle, width: "100%" }}
              />
            </div>

            <div>
              <label style={labelStyle}>Primary Button Text</label>
              <input
                value={giForm.giPrimaryText}
                onChange={(e) => setGiForm((f) => ({ ...f, giPrimaryText: e.target.value }))}
                disabled={!giLoaded}
                placeholder="Join Our Team"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Primary Button Link</label>
              <input
                value={giForm.giPrimaryLink}
                onChange={(e) => setGiForm((f) => ({ ...f, giPrimaryLink: e.target.value }))}
                disabled={!giLoaded}
                placeholder="/volunteer"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Secondary Button Text</label>
              <input
                value={giForm.giSecondaryText}
                onChange={(e) => setGiForm((f) => ({ ...f, giSecondaryText: e.target.value }))}
                disabled={!giLoaded}
                placeholder="Partner With Us"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Secondary Button Link</label>
              <input
                value={giForm.giSecondaryLink}
                onChange={(e) => setGiForm((f) => ({ ...f, giSecondaryLink: e.target.value }))}
                disabled={!giLoaded}
                placeholder="/partner"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginTop: "16px" }}>
            <button
              type="button"
              onClick={() => void saveGetInvolved()}
              disabled={giSaving || !giLoaded}
              style={primaryButtonStyle}
            >
              {giSaving ? "Saving..." : "Save Get Involved Banner"}
            </button>
          </div>
        </section>

        {/* =================================================
            MISSION SECTION
        ================================================= */}

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>
                Mission Section
              </h2>

              <p style={sectionDescriptionStyle}>
                The photo section with the rotating quote and commitment message.
              </p>
            </div>
          </div>

          <div style={contentFormGridStyle}>
            <div style={fullFieldStyle}>
              <label style={labelStyle}>Background Image URL</label>
              <input
                value={missionForm.missionImage}
                onChange={(e) => setMissionForm((f) => ({ ...f, missionImage: e.target.value }))}
                disabled={!missionLoaded}
                placeholder="https://..."
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Eyebrow Label</label>
              <input
                value={missionForm.missionEyebrow}
                onChange={(e) => setMissionForm((f) => ({ ...f, missionEyebrow: e.target.value }))}
                disabled={!missionLoaded}
                placeholder="Our Commitment"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Team Label (under the quote)</label>
              <input
                value={missionForm.missionTeamLabel}
                onChange={(e) => setMissionForm((f) => ({ ...f, missionTeamLabel: e.target.value }))}
                disabled={!missionLoaded}
                placeholder="THE WIN FOUNDATIONS TEAM"
                style={inputStyle}
              />
            </div>

            <div style={fullFieldStyle}>
              <label style={labelStyle}>Heading</label>
              <input
                value={missionForm.missionHeading}
                onChange={(e) => setMissionForm((f) => ({ ...f, missionHeading: e.target.value }))}
                disabled={!missionLoaded}
                placeholder="We Show Up When It Matters Most"
                style={inputStyle}
              />
            </div>

            <div style={fullFieldStyle}>
              <label style={labelStyle}>Paragraph Text</label>
              <textarea
                value={missionForm.missionText}
                onChange={(e) => setMissionForm((f) => ({ ...f, missionText: e.target.value }))}
                disabled={!missionLoaded}
                rows={3}
                style={{ ...textareaStyle, width: "100%" }}
              />
            </div>

            <div>
              <label style={labelStyle}>Button Text</label>
              <input
                value={missionForm.missionButtonText}
                onChange={(e) => setMissionForm((f) => ({ ...f, missionButtonText: e.target.value }))}
                disabled={!missionLoaded}
                placeholder="Support Our Relief Efforts"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Button Link</label>
              <input
                value={missionForm.missionButtonLink}
                onChange={(e) => setMissionForm((f) => ({ ...f, missionButtonLink: e.target.value }))}
                disabled={!missionLoaded}
                placeholder="/donate"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginTop: "16px" }}>
            <button
              type="button"
              onClick={() => void saveMission()}
              disabled={missionSaving || !missionLoaded}
              style={primaryButtonStyle}
            >
              {missionSaving ? "Saving..." : "Save Mission Section"}
            </button>
          </div>
        </section>

        {/* =================================================
            WORKING LOCATIONS
        ================================================= */}

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>
                Working Locations
              </h2>

              <p style={sectionDescriptionStyle}>
                The "Where We Make An Impact" map section, including the map image and text.
              </p>
            </div>
          </div>

          <div style={contentFormGridStyle}>
            <div style={fullFieldStyle}>
              <label style={labelStyle}>Map Image</label>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                <input
                  value={presenceForm.presenceMapImage}
                  onChange={(e) => setPresenceForm((f) => ({ ...f, presenceMapImage: e.target.value }))}
                  disabled={!presenceLoaded}
                  placeholder="https://... or upload a file"
                  style={{ ...inputStyle, flex: 1, minWidth: "220px" }}
                />
                <label
                  style={{
                    ...primaryButtonStyle,
                    opacity: !presenceLoaded || presenceMapUploading ? 0.6 : 1,
                    cursor: !presenceLoaded || presenceMapUploading ? "not-allowed" : "pointer",
                  }}
                >
                  {presenceMapUploading ? "Uploading..." : "Upload Image"}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={!presenceLoaded || presenceMapUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handlePresenceMapUpload(file);
                      e.currentTarget.value = "";
                    }}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            </div>

            {presenceForm.presenceMapImage.trim() && (
              <div style={fullFieldStyle}>
                <label style={labelStyle}>Map Image Preview</label>
                <div
                  style={{
                    ...modalImagePreviewStyle,
                    backgroundImage: `url("${escapeCssUrl(resolveImageUrl(presenceForm.presenceMapImage))}")`,
                  }}
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>Eyebrow Label</label>
              <input
                value={presenceForm.presenceEyebrow}
                onChange={(e) => setPresenceForm((f) => ({ ...f, presenceEyebrow: e.target.value }))}
                disabled={!presenceLoaded}
                placeholder="Working Locations"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Heading</label>
              <input
                value={presenceForm.presenceHeading}
                onChange={(e) => setPresenceForm((f) => ({ ...f, presenceHeading: e.target.value }))}
                disabled={!presenceLoaded}
                placeholder="Where We Make An Impact"
                style={inputStyle}
              />
            </div>

            <div style={fullFieldStyle}>
              <label style={labelStyle}>Left Side Text (Quote) — Paragraph 1</label>
              <textarea
                value={presenceForm.presenceText1}
                onChange={(e) => setPresenceForm((f) => ({ ...f, presenceText1: e.target.value }))}
                disabled={!presenceLoaded}
                rows={3}
                style={{ ...textareaStyle, width: "100%" }}
              />
            </div>

            <div style={fullFieldStyle}>
              <label style={labelStyle}>Left Side Text (Quote) — Paragraph 2</label>
              <textarea
                value={presenceForm.presenceText2}
                onChange={(e) => setPresenceForm((f) => ({ ...f, presenceText2: e.target.value }))}
                disabled={!presenceLoaded}
                rows={2}
                style={{ ...textareaStyle, width: "100%" }}
              />
            </div>
          </div>

          <div style={{ marginTop: "16px" }}>
            <button
              type="button"
              onClick={() => void savePresenceSection()}
              disabled={presenceSaving || !presenceLoaded}
              style={primaryButtonStyle}
            >
              {presenceSaving ? "Saving..." : "Save Working Locations"}
            </button>
          </div>
        </section>

        {/* =================================================
            PRESENCE PINS
        ================================================= */}

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>
                Presence Pins
              </h2>

              <p style={sectionDescriptionStyle}>
                The "Our Presence" badges and map pin markers. Left/Top are percentages of the map image (e.g. "78%").
              </p>
            </div>

            <button
              type="button"
              onClick={openAddPresenceLocation}
              style={primaryButtonStyle}
            >
              + Add Location
            </button>
          </div>

          <div>
            {sortedPresenceLocations.length === 0 ? (
              <div style={emptyStyle}>
                <div style={emptyIconStyle}>📍</div>
                <div style={emptyTitleStyle}>No locations found</div>
                <div style={emptyTextStyle}>
                  Add your first presence location to show it on the map.
                </div>
              </div>
            ) : (
              sortedPresenceLocations.map((location) => (
                <div key={location.id} style={heroRowStyle}>
                  <div style={{ width: "8%" }}>
                    <span style={orderBadgeStyle}>
                      {location.order}
                    </span>
                  </div>

                  <div style={{ width: "32%", paddingRight: "12px" }}>
                    <div style={rowTitleStyle}>
                      {location.name}
                    </div>
                  </div>

                  <div style={{ width: "30%", paddingRight: "12px" }}>
                    <div style={rowTextStyle}>
                      left: {location.left}, top: {location.top}
                    </div>
                  </div>

                  <div style={{ width: "10%" }}>
                    <button
                      type="button"
                      onClick={() => void togglePresenceLocationStatus(location)}
                      style={{
                        ...statusBadgeStyle,
                        ...(location.isActive
                          ? activeStatusStyle
                          : inactiveStatusStyle),
                      }}
                    >
                      {location.isActive ? "Active" : "Inactive"}
                    </button>
                  </div>

                  <div style={{ width: "20%", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => openEditPresenceLocation(location)}
                      style={editButtonStyle}
                      title="Edit"
                    >
                      ✎
                    </button>

                    <button
                      type="button"
                      onClick={() => void deletePresenceLocation(location)}
                      disabled={deletingPresenceLocationId === location.id}
                      style={{
                        ...deleteButtonStyle,
                        opacity: deletingPresenceLocationId === location.id ? 0.5 : 1,
                      }}
                      title="Delete"
                    >
                      {deletingPresenceLocationId === location.id ? "..." : "🗑"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={footerStyle}>
            Showing {sortedPresenceLocations.length} location{sortedPresenceLocations.length !== 1 ? "s" : ""}
          </div>
        </section>

      </main>

      {/* =====================================================
          HERO MODAL
      ===================================================== */}

      {heroModal && (
        <div
          style={modalOverlayStyle}
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !savingHero
            ) {
              closeHeroModal();
            }
          }}
        >
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>
              <div>
                <div style={modalTitleStyle}>
                  {editingHero
                    ? "Edit Hero Slide"
                    : "Add Hero Slide"}
                </div>

                <div style={modalSubtitleStyle}>
                  Configure the main homepage banner.
                </div>
              </div>

              <button
                type="button"
                onClick={closeHeroModal}
                disabled={savingHero}
                style={closeButtonStyle}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleHeroSubmit}>
              <div style={formGridStyle}>
                <FormField
                  label="Title"
                  required
                  value={heroForm.headline}
                  onChange={(value) =>
                    updateHeroField(
                      "headline",
                      value
                    )
                  }
                  placeholder="Enter hero title"
                />

                <FormField
                  label="Subtitle"
                  value={heroForm.subtext}
                  onChange={(value) =>
                    updateHeroField(
                      "subtext",
                      value
                    )
                  }
                  placeholder="Enter subtitle"
                />

                <div style={fullFieldStyle}>
                  <FormField
                    label="Image URL"
                    value={heroForm.image}
                    onChange={(value) =>
                      updateHeroField(
                        "image",
                        value
                      )
                    }
                    placeholder="https://..."
                  />
                </div>

                {heroForm.image.trim() && (
                  <div style={previewFieldStyle}>
                    <label style={labelStyle}>
                      Image Preview
                    </label>

                    <div
                      style={{
                        ...modalImagePreviewStyle,
                        backgroundImage:
                          `url("${escapeCssUrl(
                            resolveImageUrl(heroForm.image)
                          )}")`,
                      }}
                    />
                  </div>
                )}

                <FormField
                  label="Button Text"
                  value={heroForm.ctaText}
                  onChange={(value) =>
                    updateHeroField(
                      "ctaText",
                      value
                    )
                  }
                  placeholder="Donate Now"
                />

                <FormField
                  label="Button Link"
                  value={heroForm.ctaLink}
                  onChange={(value) =>
                    updateHeroField(
                      "ctaLink",
                      value
                    )
                  }
                  placeholder="/donate"
                />

                <FormField
                  label="Sort Order"
                  value={heroForm.order}
                  onChange={(value) =>
                    updateHeroField(
                      "order",
                      value
                    )
                  }
                  placeholder="0"
                />

                <div style={fieldStyle}>
                  <label style={labelStyle}>
                    Status
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      updateHeroField(
                        "isActive",
                        !heroForm.isActive
                      )
                    }
                    style={{
                      ...statusToggleStyle,
                      ...(heroForm.isActive
                        ? activeStatusStyle
                        : inactiveStatusStyle),
                    }}
                  >
                    {heroForm.isActive
                      ? "Active"
                      : "Inactive"}
                  </button>
                </div>
              </div>

              <div style={modalFooterStyle}>
                <button
                  type="button"
                  onClick={closeHeroModal}
                  disabled={savingHero}
                  style={cancelButtonStyle}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingHero}
                  style={saveButtonStyle}
                >
                  {savingHero
                    ? "Saving..."
                    : editingHero
                    ? "Update Slide"
                    : "Save Slide"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          QUOTE MODAL
      ===================================================== */}

      {quoteModal && (
        <div
          style={modalOverlayStyle}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeQuoteModal();
          }}
        >
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>
              <h2 style={modalTitleStyle}>
                {editingQuote ? "Edit Quote" : "New Quote"}
              </h2>

              <button
                type="button"
                onClick={closeQuoteModal}
                style={closeButtonStyle}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleQuoteSubmit}>
              <div style={formGridStyle}>
                <div style={fullFieldStyle}>
                  <label style={labelStyle}>
                    Quote Text *
                  </label>

                  <textarea
                    value={quoteForm.text}
                    onChange={(event) =>
                      updateQuoteField("text", event.target.value)
                    }
                    placeholder="Enter the quote text"
                    rows={4}
                    style={{ ...textareaStyle, width: "100%" }}
                    required
                  />
                </div>

                <FormField
                  label="Display Order"
                  value={quoteForm.order}
                  onChange={(value) => updateQuoteField("order", value)}
                  placeholder="0"
                />

                <div style={fieldStyle}>
                  <label style={labelStyle}>
                    Status
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      updateQuoteField("isActive", !quoteForm.isActive)
                    }
                    style={{
                      ...statusToggleStyle,
                      ...(quoteForm.isActive
                        ? activeStatusStyle
                        : inactiveStatusStyle),
                    }}
                  >
                    {quoteForm.isActive ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>

              <div style={modalFooterStyle}>
                <button
                  type="button"
                  onClick={closeQuoteModal}
                  disabled={savingQuote}
                  style={cancelButtonStyle}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingQuote}
                  style={saveButtonStyle}
                >
                  {savingQuote
                    ? "Saving..."
                    : editingQuote
                    ? "Update Quote"
                    : "Save Quote"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          PRESENCE LOCATION MODAL
      ===================================================== */}

      {presenceLocationModal && (
        <div
          style={modalOverlayStyle}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePresenceLocationModal();
          }}
        >
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>
              <h2 style={modalTitleStyle}>
                {editingPresenceLocation ? "Edit Location" : "New Location"}
              </h2>

              <button
                type="button"
                onClick={closePresenceLocationModal}
                style={closeButtonStyle}
              >
                ×
              </button>
            </div>

            <form onSubmit={handlePresenceLocationSubmit}>
              <div style={formGridStyle}>
                <div style={fullFieldStyle}>
                  <FormField
                    label="Location Name"
                    required
                    value={presenceLocationForm.name}
                    onChange={(value) => updatePresenceLocationField("name", value)}
                    placeholder="Bengaluru"
                  />
                </div>

                <FormField
                  label="Left Position (%)"
                  value={presenceLocationForm.left}
                  onChange={(value) => updatePresenceLocationField("left", value)}
                  placeholder="78%"
                />

                <FormField
                  label="Top Position (%)"
                  value={presenceLocationForm.top}
                  onChange={(value) => updatePresenceLocationField("top", value)}
                  placeholder="80.2%"
                />

                <FormField
                  label="Display Order"
                  value={presenceLocationForm.order}
                  onChange={(value) => updatePresenceLocationField("order", value)}
                  placeholder="0"
                />

                <div style={fieldStyle}>
                  <label style={labelStyle}>
                    Status
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      updatePresenceLocationField("isActive", !presenceLocationForm.isActive)
                    }
                    style={{
                      ...statusToggleStyle,
                      ...(presenceLocationForm.isActive
                        ? activeStatusStyle
                        : inactiveStatusStyle),
                    }}
                  >
                    {presenceLocationForm.isActive ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>

              <div style={modalFooterStyle}>
                <button
                  type="button"
                  onClick={closePresenceLocationModal}
                  disabled={savingPresenceLocation}
                  style={cancelButtonStyle}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingPresenceLocation}
                  style={saveButtonStyle}
                >
                  {savingPresenceLocation
                    ? "Saving..."
                    : editingPresenceLocation
                    ? "Update Location"
                    : "Save Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

/* =========================================================
   FORM FIELD
========================================================= */

function FormField({
  label,
  required = false,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div style={fieldStyle}>
      <label style={labelStyle}>
        {label}

        {required && (
          <span style={requiredStyle}>
            *
          </span>
        )}
      </label>

      <input
        type="text"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

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

// Hero slide images are either a full URL (e.g. an uploaded media file) or a
// path relative to the public frontend's own /public folder (legacy seed data
// like "/assets/hero-1.jpg") — those never resolve against this admin app's
// own origin, so prefix them with the frontend's site URL for preview here.
const FRONTEND_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001").replace(/\/$/, "");

function resolveImageUrl(value: string) {
  if (!value) return value;
  if (/^https?:\/\//i.test(value)) return value;
  return `${FRONTEND_SITE_URL}${value.startsWith("/") ? "" : "/"}${value}`;
}

/* =========================================================
   PAGE STYLES
========================================================= */

const pageStyle: CSSProperties = {
  width: "100%",
  minHeight: "100%",
  boxSizing: "border-box",
};

const mainStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
};

const headerStyle: CSSProperties = {
  marginBottom: "22px",
};

const breadcrumbStyle: CSSProperties = {
  fontSize: "10px",
  color: "#98a2b3",
  marginBottom: "5px",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "25px",
  fontWeight: 750,
  color: "#101828",
};

const descriptionStyle: CSSProperties = {
  margin: "5px 0 0",
  fontSize: "12px",
  color: "#667085",
};

const sectionStyle: CSSProperties = {
  marginBottom: "26px",
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  marginBottom: "13px",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "15px",
  fontWeight: 750,
  color: "#101828",
};

const sectionDescriptionStyle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: "10px",
  color: "#98a2b3",
};

const primaryButtonStyle: CSSProperties = {
  height: "36px",
  padding: "0 15px",
  border: "none",
  borderRadius: "6px",
  background: "#2563eb",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: "11px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const toolbarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginBottom: "12px",
};

const searchWrapperStyle: CSSProperties = {
  width: "400px",
  maxWidth: "100%",
  height: "36px",
  display: "flex",
  alignItems: "center",
  border: "1px solid #d0d5dd",
  background: "#ffffff",
  borderRadius: "6px",
  padding: "0 10px",
  boxSizing: "border-box",
};

const searchIconStyle: CSSProperties = {
  fontSize: "17px",
  color: "#98a2b3",
  marginRight: "7px",
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  border: "none",
  outline: "none",
  fontSize: "11px",
  color: "#344054",
  background: "transparent",
};

const cardStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  overflow: "hidden",
};

const heroHeaderRowStyle: CSSProperties = {
  minHeight: "40px",
  display: "flex",
  alignItems: "center",
  padding: "0 17px",
  background: "#f9fafb",
  borderBottom: "1px solid #eaecf0",
  color: "#667085",
  fontSize: "9px",
  fontWeight: 700,
};

const itemHeaderRowStyle: CSSProperties = {
  ...heroHeaderRowStyle,
};

const heroRowStyle: CSSProperties = {
  minHeight: "82px",
  display: "flex",
  alignItems: "center",
  padding: "0 17px",
  borderBottom: "1px solid #f2f4f7",
  color: "#344054",
};

const itemRowStyle: CSSProperties = {
  minHeight: "75px",
  display: "flex",
  alignItems: "center",
  padding: "0 17px",
  borderBottom: "1px solid #f2f4f7",
  color: "#344054",
};

const heroImageStyle: CSSProperties = {
  width: "82px",
  height: "52px",
  borderRadius: "5px",
  backgroundColor: "#f2f4f7",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const imagePreviewStyle: CSSProperties = {
  width: "52px",
  height: "38px",
  borderRadius: "5px",
  backgroundColor: "#f2f4f7",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const noImageStyle: CSSProperties = {
  color: "#98a2b3",
  fontSize: "7px",
  textAlign: "center",
};

const orderBadgeStyle: CSSProperties = {
  display: "inline-flex",
  minWidth: "24px",
  height: "24px",
  padding: "0 5px",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "5px",
  background: "#f2f4f7",
  color: "#475467",
  fontSize: "10px",
  fontWeight: 700,
};

const rowTitleStyle: CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  color: "#344054",
  lineHeight: 1.4,
  wordBreak: "break-word",
};

const rowDateStyle: CSSProperties = {
  marginTop: "4px",
  fontSize: "8px",
  color: "#98a2b3",
};

const rowTextStyle: CSSProperties = {
  fontSize: "10px",
  color: "#475467",
  lineHeight: 1.4,
  wordBreak: "break-word",
};

const smallTextStyle: CSSProperties = {
  marginTop: "4px",
  fontSize: "8px",
  color: "#98a2b3",
  wordBreak: "break-all",
};

const descriptionCellStyle: CSSProperties = {
  fontSize: "10px",
  color: "#667085",
  lineHeight: 1.5,
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const mutedStyle: CSSProperties = {
  color: "#98a2b3",
  fontSize: "10px",
};

const linkStyle: CSSProperties = {
  color: "#2563eb",
  fontSize: "10px",
  fontWeight: 650,
  textDecoration: "none",
};

const buttonPreviewStyle: CSSProperties = {
  display: "inline-block",
  maxWidth: "90px",
  padding: "5px 8px",
  borderRadius: "4px",
  background: "#eef4ff",
  color: "#2563eb",
  fontSize: "8px",
  fontWeight: 700,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const statusBadgeStyle: CSSProperties = {
  border: "none",
  borderRadius: "10px",
  padding: "5px 8px",
  fontSize: "8px",
  fontWeight: 700,
  cursor: "pointer",
};

const activeStatusStyle: CSSProperties = {
  background: "#ecfdf3",
  color: "#027a48",
};

const inactiveStatusStyle: CSSProperties = {
  background: "#f2f4f7",
  color: "#667085",
};

const statusToggleStyle: CSSProperties = {
  width: "100%",
  height: "36px",
  borderRadius: "5px",
  border: "1px solid #d0d5dd",
  cursor: "pointer",
  fontSize: "10px",
  fontWeight: 700,
};

const editButtonStyle: CSSProperties = {
  width: "28px",
  height: "28px",
  border: "1px solid #d0d5dd",
  background: "#ffffff",
  color: "#475467",
  borderRadius: "5px",
  cursor: "pointer",
  fontSize: "13px",
};

const deleteButtonStyle: CSSProperties = {
  width: "28px",
  height: "28px",
  border: "1px solid #fecaca",
  background: "#fff7f7",
  color: "#dc2626",
  borderRadius: "5px",
  cursor: "pointer",
  fontSize: "12px",
};

const emptyStyle: CSSProperties = {
  textAlign: "center",
  padding: "55px 20px",
};

const emptyIconStyle: CSSProperties = {
  width: "44px",
  height: "44px",
  borderRadius: "8px",
  background: "#eef4ff",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 12px",
  fontSize: "18px",
};

const emptyTitleStyle: CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  color: "#344054",
};

const emptyTextStyle: CSSProperties = {
  maxWidth: "380px",
  margin: "5px auto 14px",
  fontSize: "10px",
  lineHeight: 1.5,
  color: "#98a2b3",
};

const footerStyle: CSSProperties = {
  marginTop: "9px",
  color: "#98a2b3",
  fontSize: "9px",
};

/* =========================================================
   MODAL
========================================================= */

const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  zIndex: 1000,
};

const modalStyle: CSSProperties = {
  width: "100%",
  maxWidth: "620px",
  maxHeight: "90vh",
  overflowY: "auto",
  background: "#ffffff",
  borderRadius: "9px",
  border: "1px solid #e5e7eb",
  boxShadow:
    "0 20px 60px rgba(15,23,42,0.18)",
};

const modalHeaderStyle: CSSProperties = {
  padding: "18px 20px",
  borderBottom: "1px solid #eaecf0",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "15px",
};

const modalTitleStyle: CSSProperties = {
  fontSize: "15px",
  fontWeight: 750,
  color: "#101828",
};

const modalSubtitleStyle: CSSProperties = {
  marginTop: "3px",
  fontSize: "10px",
  color: "#98a2b3",
};

const closeButtonStyle: CSSProperties = {
  width: "28px",
  height: "28px",
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  borderRadius: "5px",
  color: "#667085",
  fontSize: "18px",
  cursor: "pointer",
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "14px",
  padding: "18px 20px",
};

const contentFormGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "14px",
};

const fieldStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const fullFieldStyle: CSSProperties = {
  gridColumn: "1 / -1",
};

const previewFieldStyle: CSSProperties = {
  gridColumn: "1 / -1",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const labelStyle: CSSProperties = {
  color: "#344054",
  fontSize: "10px",
  fontWeight: 700,
};

const requiredStyle: CSSProperties = {
  color: "#dc2626",
  marginLeft: "3px",
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: "36px",
  boxSizing: "border-box",
  border: "1px solid #d0d5dd",
  borderRadius: "5px",
  outline: "none",
  padding: "0 10px",
  color: "#344054",
  background: "#ffffff",
  fontSize: "11px",
};

const textareaStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #d0d5dd",
  borderRadius: "5px",
  outline: "none",
  padding: "9px 10px",
  color: "#344054",
  background: "#ffffff",
  fontSize: "11px",
  lineHeight: 1.5,
  resize: "vertical",
};

const modalImagePreviewStyle: CSSProperties = {
  width: "100%",
  height: "150px",
  borderRadius: "6px",
  backgroundColor: "#f2f4f7",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  border: "1px solid #e5e7eb",
};

const modalFooterStyle: CSSProperties = {
  padding: "13px 20px",
  borderTop: "1px solid #eaecf0",
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
};

const cancelButtonStyle: CSSProperties = {
  height: "34px",
  padding: "0 13px",
  border: "1px solid #d0d5dd",
  background: "#ffffff",
  color: "#475467",
  borderRadius: "5px",
  fontSize: "10px",
  fontWeight: 650,
  cursor: "pointer",
};

const saveButtonStyle: CSSProperties = {
  height: "34px",
  padding: "0 16px",
  border: "none",
  background: "#2563eb",
  color: "#ffffff",
  borderRadius: "5px",
  fontSize: "10px",
  fontWeight: 700,
  cursor: "pointer",
};

/* =========================================================
   LOADING
========================================================= */

const loadingPageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "#f4f6f9",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const loadingBoxStyle: CSSProperties = {
  width: "300px",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "35px",
  textAlign: "center",
};

const loadingSpinnerStyle: CSSProperties = {
  fontSize: "28px",
  color: "#2563eb",
};

const loadingTitleStyle: CSSProperties = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#101828",
  marginTop: "10px",
};

const loadingTextStyle: CSSProperties = {
  fontSize: "11px",
  color: "#98a2b3",
  marginTop: "4px",
};