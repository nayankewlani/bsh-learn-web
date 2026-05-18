import React from "react";

const CATEGORIES = ["Advance Hypnosis", "Hypnosis 2.0", "Art of shadow work", "Reiki", "Akashik"];
const LEVELS = ["beginner", "intermediate", "advanced"];
const LANGUAGES = ["Hindi", "English", "Tamil", "Telugu", "Bengali", "Marathi"];

interface Filters {
  category: string;
  level: string;
  language: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
}

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const select: React.CSSProperties = { background: "#1e1b4b", border: "1.5px solid #3730a3", borderRadius: 10, color: "#c4b5fd", padding: "8px 12px", fontSize: 13, cursor: "pointer", width: "100%" };

const CourseFilter: React.FC<Props> = ({ filters, onChange }) => {
  const set = (key: keyof Filters, value: string) => onChange({ ...filters, [key]: value });
  const reset = () => onChange({ category: "", level: "", language: "", minPrice: "", maxPrice: "", sort: "popular" });

  return (
    <div style={{ background: "#13122a", border: "1px solid #1e1b4b", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700, color: "#f3f4f6", fontSize: 15 }}>Filters</span>
        <button onClick={reset} style={{ background: "none", border: "none", color: "#7c3aed", cursor: "pointer", fontSize: 13 }}>Reset</button>
      </div>

      <div>
        <label style={{ color: "#9ca3af", fontSize: 12, marginBottom: 6, display: "block" }}>Sort By</label>
        <select style={select} value={filters.sort} onChange={(e) => set("sort", e.target.value)}>
          <option value="popular">Most Popular</option>
          <option value="newest">Newest</option>
          <option value="rating">Top Rated</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      <div>
        <label style={{ color: "#9ca3af", fontSize: 12, marginBottom: 6, display: "block" }}>Category</label>
        <select style={select} value={filters.category} onChange={(e) => set("category", e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label style={{ color: "#9ca3af", fontSize: 12, marginBottom: 6, display: "block" }}>Level</label>
        <select style={select} value={filters.level} onChange={(e) => set("level", e.target.value)}>
          <option value="">All Levels</option>
          {LEVELS.map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
        </select>
      </div>

      <div>
        <label style={{ color: "#9ca3af", fontSize: 12, marginBottom: 6, display: "block" }}>Language</label>
        <select style={select} value={filters.language} onChange={(e) => set("language", e.target.value)}>
          <option value="">All Languages</option>
          {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      <div>
        <label style={{ color: "#9ca3af", fontSize: 12, marginBottom: 6, display: "block" }}>Price Range (₹)</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="Min" value={filters.minPrice} onChange={(e) => set("minPrice", e.target.value)} type="number" style={{ ...select, width: "50%" }} />
          <input placeholder="Max" value={filters.maxPrice} onChange={(e) => set("maxPrice", e.target.value)} type="number" style={{ ...select, width: "50%" }} />
        </div>
      </div>
    </div>
  );
};

export default CourseFilter;
