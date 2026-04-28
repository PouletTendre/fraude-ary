"use client";

import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useState } from "react";

interface CompanyProfileProps {
  data?: {
    symbol: string;
    name?: string;
    sector?: string;
    industry?: string;
    description?: string;
    website?: string;
    employees?: number;
    country?: string;
    exchange?: string;
    currency?: string;
  };
  isLoading?: boolean;
}

export function CompanyProfile({ data, isLoading }: CompanyProfileProps) {
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <Card style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <Skeleton style={{ height: "24px", width: "55%", borderRadius: "var(--r-md)" }} />
        <Skeleton style={{ height: "14px", width: "35%", borderRadius: "var(--r-md)" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingTop: "4px" }}>
          <Skeleton style={{ height: "12px", width: "100%", borderRadius: "var(--r-md)" }} />
          <Skeleton style={{ height: "12px", width: "95%", borderRadius: "var(--r-md)" }} />
          <Skeleton style={{ height: "12px", width: "80%", borderRadius: "var(--r-md)" }} />
          <Skeleton style={{ height: "12px", width: "60%", borderRadius: "var(--r-md)" }} />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: "14px",
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              style={{ height: "40px", borderRadius: "var(--r-md)" }}
            />
          ))}
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const infoItems: { label: string; value: string }[] = [
    { label: "Website", value: data.website || "—" },
    {
      label: "Employees",
      value: data.employees ? data.employees.toLocaleString() : "—",
    },
    { label: "Country", value: data.country || "—" },
    { label: "Exchange", value: data.exchange || "—" },
    { label: "Currency", value: data.currency || "—" },
  ];

  const hasDescription = Boolean(data.description);
  const needsTruncation = (data.description?.length || 0) > 300;

  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <h2
          style={{
            fontSize: "24px",
            fontWeight: 400,
            letterSpacing: "-0.288px",
            lineHeight: 1.33,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          {data.name || data.symbol}
        </h2>
        {(data.sector || data.industry) && (
          <span
            style={{
              fontSize: "14px",
              fontWeight: 510,
              lineHeight: 1.5,
              color: "var(--text-secondary)",
            }}
          >
            {data.sector}
            {data.sector && data.industry ? " · " : ""}
            {data.industry}
          </span>
        )}
      </div>

      {hasDescription && (
        <div>
          <p
            style={{
              fontSize: "14px",
              fontWeight: 400,
              lineHeight: 1.6,
              color: "var(--text-secondary)",
              margin: 0,
              display: expanded ? "block" : "-webkit-box",
              WebkitLineClamp: expanded ? "unset" : 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              ...(expanded ? {} : { textOverflow: "ellipsis" }),
            }}
          >
            {data.description}
          </p>
          {needsTruncation && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                fontSize: "13px",
                fontWeight: 510,
                color: "var(--primary)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                marginTop: "4px",
              }}
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: "12px",
        }}
      >
        {infoItems.map((item) => (
          <div
            key={item.label}
            style={{ display: "flex", flexDirection: "column", gap: "2px" }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 510,
                lineHeight: 1.4,
                color: "var(--text-tertiary)",
              }}
            >
              {item.label}
            </span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 510,
                lineHeight: 1.5,
                color: "var(--text-primary)",
              }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
