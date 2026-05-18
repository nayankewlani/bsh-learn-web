import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCourseStore } from "../stores/courseStore";
import CourseGrid from "../components/course/CourseGrid";
import CourseFilter from "../components/course/CourseFilter";
import Button from "../components/ui/Button";

const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { courses, total, totalPages, fetchCourses, isLoading } = useCourseStore();
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

  return (
    <div style={{ background: "#0a0914", minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f3f4f6", marginBottom: 8 }}>Explore Courses</h1>
        <p style={{ color: "#9ca3af", marginBottom: 24 }}>{total.toLocaleString()} courses available</p>

        <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, marginBottom: 32 }}>
          <input name="search" defaultValue={search} placeholder="Search courses, educators, topics..." style={{ flex: 1, padding: "10px 16px", background: "#13122a", border: "1.5px solid #3730a3", borderRadius: 12, color: "#f3f4f6", fontSize: 15, outline: "none" }} />
          <Button type="submit" size="md">Search</Button>
        </form>

        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 28, alignItems: "start" }}>
          <CourseFilter filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} />
          <div>
            <CourseGrid courses={courses} loading={isLoading} emptyMessage="No courses match your filters" />
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32 }}>
                <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
                <span style={{ color: "#9ca3af", display: "flex", alignItems: "center", fontSize: 14 }}>Page {page} of {totalPages}</span>
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
