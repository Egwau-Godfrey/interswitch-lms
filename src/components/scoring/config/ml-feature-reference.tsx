"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Search } from "lucide-react";
import type { MLModelFeature } from "@/lib/types/scoring";

interface MLFeatureReferenceProps {
  features: MLModelFeature[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Income: "bg-blue-100 text-blue-700",
  Expense: "bg-orange-100 text-orange-700",
  Balance: "bg-green-100 text-green-700",
  "Transaction Patterns": "bg-purple-100 text-purple-700",
  "Derived Ratios": "bg-cyan-100 text-cyan-700",
  Trends: "bg-indigo-100 text-indigo-700",
  Consistency: "bg-teal-100 text-teal-700",
  "Risk Indicators": "bg-red-100 text-red-700",
};

export function MLFeatureReference({ features }: MLFeatureReferenceProps) {
  const [search, setSearch] = React.useState("");
  const [openCats, setOpenCats] = React.useState<Set<string>>(
    new Set(features.map((f) => f.category))
  );

  const filtered = React.useMemo(() => {
    if (!search.trim()) return features;
    const q = search.toLowerCase();
    return features.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q)
    );
  }, [features, search]);

  const grouped = React.useMemo(() => {
    const map: Record<string, MLModelFeature[]> = {};
    for (const f of filtered) {
      if (!map[f.category]) map[f.category] = [];
      map[f.category].push(f);
    }
    return map;
  }, [filtered]);

  const toggleCat = (cat: string) => {
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          These {features.length} features are automatically extracted from
          agent transactions and fed to the ML model. They cannot be edited —
          they are determined by the feature extraction code.
        </AlertDescription>
      </Alert>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search features..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-2">
        {Object.entries(grouped).map(([cat, feats]) => (
          <Collapsible
            key={cat}
            open={openCats.has(cat)}
            onOpenChange={() => toggleCat(cat)}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full rounded-lg border px-4 py-2.5 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={CATEGORY_COLORS[cat] ?? ""}
                >
                  {cat}
                </Badge>
                <span className="text-sm font-medium">
                  {feats.length} feature{feats.length !== 1 ? "s" : ""}
                </span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${
                  openCats.has(cat) ? "rotate-180" : ""
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1">
              <div className="rounded-lg border border-t-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">
                        Feature Name
                      </th>
                      <th className="text-left px-4 py-2 font-medium">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {feats.map((f, i) => (
                      <tr
                        key={f.name}
                        className={i % 2 === 0 ? "bg-transparent" : "bg-muted/20"}
                      >
                        <td className="px-4 py-2 font-mono text-xs">
                          {f.name}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {f.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          No features match &quot;{search}&quot;.
        </p>
      )}
    </div>
  );
}
