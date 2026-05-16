import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { ListRow } from "@/components/app/ListRow";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/app/EmptyState";
import { useCustomers } from "@/store/domain";
import { npr } from "@/lib/utils";

const BUCKET_LABEL: Record<string, string> = {
  "0-7": "0–7 days",
  "8-30": "8–30 days",
  "31-60": "31–60 days",
  "60+": "60+ days",
  all: "All overdue",
};

const BUCKET_RANGE: Record<string, [number, number]> = {
  "0-7": [0, 7],
  "8-30": [8, 30],
  "31-60": [31, 60],
  "60+": [61, Infinity],
  all: [0, Infinity],
};

export const AgingDetailPage = () => {
  const { bucket = "all" } = useParams();
  const navigate = useNavigate();
  const CUSTOMERS = useCustomers();
  const [min, max] = BUCKET_RANGE[bucket] ?? [0, Infinity];

  const label = BUCKET_LABEL[bucket] ?? "All overdue";
  const rows = CUSTOMERS.filter(
    (c) => c.outstanding > 0 && c.oldestBillDays >= min && c.oldestBillDays <= max,
  ).sort((a, b) => b.outstanding - a.outstanding);

  return (
    <PageShell>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700"
      >
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="mb-4 text-lg font-semibold text-foreground">Aging: {label}</h1>

      {rows.length === 0 ? (
        <EmptyState title="No customers in this bucket" />
      ) : (
        <Card>
          <CardContent className="p-0 px-4">
            {rows.map((c) => (
              <ListRow
                key={c.id}
                left={c.name}
                right={npr(c.outstanding)}
                sub={`${c.oldestBillDays}d overdue · ${c.area}`}
                onClick={() => navigate(`/app/payments/new?customerId=${c.id}`)}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
};
