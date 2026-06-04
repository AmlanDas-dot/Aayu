import { useState } from "react";
import { HealthRecord } from "../../types";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  records: HealthRecord[];
  suggestedRecordIndexes: number[];
  onSelectRecord: (record: HealthRecord) => void;
  onDeleteRecord: (id: string) => void;
}

export function Sidebar({
  isOpen,
  setIsOpen,
  records,
  suggestedRecordIndexes,
  onSelectRecord,
  onDeleteRecord,
}: SidebarProps) {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "week" | "month" | "year">("all");

  const isWithinRange = (createdAt: number) => {
    const diff = Date.now() - createdAt;
    const oneDay = 24 * 60 * 60 * 1000;
    switch (dateFilter) {
      case "week":
        return diff <= 7 * oneDay;
      case "month":
        return diff <= 30 * oneDay;
      case "year":
        return diff <= 365 * oneDay;
      default:
        return true;
    }
  };

  const isRecordVisible = (rec: HealthRecord) => {
    const text = `${rec.symptoms} ${rec.summary} ${rec.location}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const matchesDate = isWithinRange(rec.createdAt);
    return matchesSearch && matchesDate;
  };

  // Rank matches: suggested items rise to the top
  const orderedRecords = [...records].sort((a, b) => {
    const aIndex = records.findIndex((r) => r.id === a.id);
    const bIndex = records.findIndex((r) => r.id === b.id);
    
    const aSuggested = suggestedRecordIndexes.includes(aIndex);
    const bSuggested = suggestedRecordIndexes.includes(bIndex);

    if (aSuggested && !bSuggested) return -1;
    if (!aSuggested && bSuggested) return 1;
    return 0;
  });

  return (
    <div className={`flashcard-sidebar ${isOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      <button
        className="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
      />

      <div className="sidebar-inner" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search symptoms or logs..."
          className="flashcard-search"
        />

        <div className="flashcard-date-filters">
          {(["all", "week", "month", "year"] as const).map((range) => (
            <button
              key={range}
              className={`date-filter-btn ${dateFilter === range ? "active" : ""}`}
              onClick={() => setDateFilter(range)}
            >
              {range}
            </button>
          ))}
        </div>

        <h3 className="font-semibold mb-1 mt-4">Consultation History</h3>
        <p className="text-xs text-[#999ba1] italic mb-3">
          Click a record to import it as context
        </p>

        <div className="sidebar-records-list" style={{ overflowY: "auto", flex: 1 }}>
          {orderedRecords.map((rec, index) => {
            const idx = records.findIndex((r) => r.id === rec.id);
            const visible = isRecordVisible(rec);

            if (idx === -1) return null;
            const isSuggested = suggestedRecordIndexes.includes(idx);

            return (
              <div
                key={rec.id}
                className={`sidebar-flashcard-wrapper ${visible ? "visible" : "hidden"}`}
                style={{
                  transitionDelay: visible ? "0ms" : `${index * 40}ms`,
                  display: visible ? "block" : "none"
                }}
              >
                <div className="sidebar-flashcard-container">
                  <div
                    onClick={() => onSelectRecord(rec)}
                    className={`sidebar-flashcard ${isSuggested ? "suggested" : ""}`}
                  >
                    <div className="sidebar-flashcard-title">
                      {rec.symptoms.length > 40 ? rec.symptoms.substring(0, 40) + "..." : rec.symptoms || "Untyped Symptoms"}
                    </div>
                    <div className="sidebar-flashcard-summary">
                      {rec.summary}
                    </div>
                    {rec.location && (
                      <div className="text-xs text-blue-500 mt-1" style={{ opacity: 0.8 }}>
                        📍 {rec.location}
                      </div>
                    )}
                  </div>

                  <button
                    className="flashcard-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      const ok = window.confirm("Delete this session record permanently?");
                      if (ok) onDeleteRecord(rec.id);
                    }}
                    title="Delete record"
                  >
                    <img
                      src="/bin.png"
                      alt="Delete record"
                      className="flashcard-delete-icon"
                    />
                  </button>
                </div>
              </div>
            );
          })}

          {records.length > 0 && records.every((r) => !isRecordVisible(r)) && (
            <p className="text-xs text-[#9ca3af] italic">No matching records found</p>
          )}

          {records.length === 0 && (
            <p className="text-xs text-[#9ca3af] italic">No saved history yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
