import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCourseStore } from "../stores/courseStore";
import { useThemeStore } from "../stores/themeStore";
import CourseGrid from "../components/course/CourseGrid";
import CourseFilter from "../components/course/CourseFilter";
import Button from "../components/ui/Button";
import client from "../api/client";

interface Program {
  _id: string;
  programId: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  discountPrice?: number;
  duration?: string;
  level?: string;
  programType?: string;
  tags?: string[];
  features?: string[];
}

const fmt = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const levelColor: Record<string, string> = {
  beginner: "#16a34a",
  intermediate: "#d97706",
  advanced: "#dc2626",
};

const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { courses, total, totalPages, fetchCourses, isLoading } = useCourseStore();
  const { t } = useThemeStore();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    level: "",
    language: "",
    minPrice: "",
    maxPrice: "",
    sort: "popular",
  });
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);

  useEffect(() => {
    client.get("/courses/programs/public")
      .then(({ data }) => setPrograms(data.programs || []))
      .catch(() => {})
      .finally(() => setProgramsLoading(false));
  }, []);

  useEffect(() => {
    const params: Record<string, string | number> = { page, limit: 12, sort: filters.sort };
    if (search) params.search = search;
    if (filters.category) params.category = filters.category;
    if (filters.level) params.level = filters.level;
    if (filters.language) params.language = filters.language;
    if (filters.minPrice) params.minPrice = Number(filters.minPrice) * 100;
    if (filters.maxPrice) params.maxPrice = Number(filters.maxPrice) * 100;
    fetchCourses(params);
  }, [filters, page, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    const q = (e.currentTarget as HTMLFormElement).search.value;
    setSearch(q);
    setSearchParams(q ? { q } : {});
  };

  const typeLabel: Record<string, string> = {
    certification: "Certification",
    subscription: "Subscription",
    workshop: "Workshop",
    masterclass: "Masterclass",
    "live-program": "Live Program",
    "self-paced": "Self-Paced",
  };

  return (
    <div style={{ background: t.bgPrimary, minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: t.textPrimary, marginBottom: 8 }}>Explore Courses</h1>
        <p style={{ color: t.textSecond, marginBottom: 24 }}>
          {programs.length + total} programs & courses available
        </p>

        <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, marginBottom: 32 }}>
          <input name="search" defaultValue={search} placeholder="Search courses, educators, topics..."
            style={{ flex: 1, padding: "10px 16px", background: t.bgInput, border: `1.5px solid ${t.borderLight}`, borderRadius: 12, color: t.textPrimary, fontSize: 15, outline: "none" }} />
          <Button type="submit" size="md">Search</Button>
        </form>

        {/* ── Flagship Programs Section ──────────────────────────────────────── */}
        {(programsLoading || programs.length > 0) && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 4, height: 24, background: "linear-gradient(180deg,#7c3aed,#5b21b6)", borderRadius: 2 }} />
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: t.textPrimary }}>Flagship Programs</h2>
              <span style={{ fontSize: 12, background: "rgba(124,58,237,0.12)", color: "#7c3aed", padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>
                BSH Healers Certified
              </span>
            </div>

            {programsLoading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20 }}>
                {[1, 2].map(i => (
                  <div key={i} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, overflow: "hidden", animation: "pulse 1.5s ease-in-out infinite" }}>
                    <div style={{ aspectRatio: "16/9", background: t.bgInput }} />
                    <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ height: 14, background: t.bgInput, borderRadius: 6, width: "40%" }} />
                      <div style={{ height: 18, background: t.bgInput, borderRadius: 6 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20 }}>
                {programs.map(p => (
                  <div key={p._id}
                    onClick={() => navigate(`/courses/${p.programId}`)}
                    style={{ background: t.bgCard, border: `1.5px solid ${t.border}`, borderRadius: 16, overflow: "hidden", cursor: "pointer", transition: "transform 0.18s, box-shadow 0.18s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 32px rgba(124,58,237,0.18)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}
                  >
                    {/* Thumbnail */}
                    <div style={{ position: "relative", aspectRatio: "16/9", background: t.bgInput, overflow: "hidden" }}>
                      {p.thumbnail
                        ? <img src={p.thumbnail} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#1a0a2e,#2d1065)", fontSize: 48 }}>🧠</div>
                      }
                      {p.programType && (
                        <span style={{ position: "absolute", top: 10, left: 10, background: "rgba(124,58,237,0.9)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, backdropFilter: "blur(4px)" }}>
                          {typeLabel[p.programType] || p.programType}
                        </span>
                      )}
                      {p.discountPrice && p.discountPrice < p.price && (
                        <span style={{ position: "absolute", top: 10, right: 10, background: "#dc2626", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                          {Math.round((1 - p.discountPrice / p.price) * 100)}% OFF
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ padding: "16px 18px 18px" }}>
                      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                        {p.level && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: levelColor[p.level] || "#7c3aed", background: `${levelColor[p.level] || "#7c3aed"}18`, padding: "2px 8px", borderRadius: 12 }}>
                            {p.level.charAt(0).toUpperCase() + p.level.slice(1)}
                          </span>
                        )}
                        {p.duration && (
                          <span style={{ fontSize: 11, color: t.textSecond, background: t.bgInput, padding: "2px 8px", borderRadius: 12 }}>
                            ⏱ {p.duration}
                          </span>
                        )}
                      </div>

                      <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: t.textPrimary, lineHeight: 1.3 }}>{p.title}</h3>
                      <p style={{ margin: "0 0 14px", fontSize: 13, color: t.textSecond, lineHeight: 1.5,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {p.description}
                      </p>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          {p.discountPrice && p.discountPrice < p.price ? (
                            <div>
                              <span style={{ fontSize: 18, fontWeight: 900, color: t.textPrimary }}>{fmt(p.discountPrice)}</span>
                              <span style={{ fontSize: 13, color: t.textSecond, textDecoration: "line-through", marginLeft: 6 }}>{fmt(p.price)}</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: 18, fontWeight: 900, color: t.textPrimary }}>{p.price ? fmt(p.price) : "Free"}</span>
                          )}
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/courses/${p.programId}`); }}
                          style={{ padding: "8px 16px", background: "linear-gradient(135deg,#7c3aed,#5b21b6)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                          View Program
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Divider ────────────────────────────────────────────────────────── */}
        {programs.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
            <div style={{ flex: 1, height: 1, background: t.border }} />
            <span style={{ fontSize: 13, color: t.textSecond, fontWeight: 600, whiteSpace: "nowrap" }}>All Courses</span>
            <div style={{ flex: 1, height: 1, background: t.border }} />
          </div>
        )}

        {/* ── Regular Courses ────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 28, alignItems: "start" }}>
          <CourseFilter filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} />
          <div>
            <CourseGrid courses={courses} loading={isLoading} emptyMessage="No courses match your filters" />
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32 }}>
                <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
                <span style={{ color: t.textSecond, display: "flex", alignItems: "center", fontSize: 14 }}>Page {page} of {totalPages}</span>
                <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
