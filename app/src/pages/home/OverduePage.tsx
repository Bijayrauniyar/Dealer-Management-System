import { useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { ListRow } from "@/components/app/ListRow";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/app/EmptyState";
import { useBusinessSettings, useCustomers } from "@/store/domain";
import { npr } from "@/lib/utils";

export const OverduePage = () => {
  const navigate = useNavigate();
  const business = useBusinessSettings();
  const OVERDUE_DAYS = business.overdueDays;
  const customers = useCustomers();
  const overdue = useMemo(
    () =>
      customers
        .filter((c) => c.oldestBillDays > OVERDUE_DAYS && c.outstanding > 0)
        .sort((a, b) => b.outstanding - a.outstanding),
    [customers, OVERDUE_DAYS],
  );

  return (
    <PageShell>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm font-medium text-teal-600">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="mb-4 text-lg font-semibold">Overdue ({OVERDUE_DAYS}+ days) and due &gt; 0</h1>
      <p className="mb-4 text-xs text-muted">
        <Link to="/app/home/outstanding" className="font-medium text-teal-600 underline">
          View all open bills
        </Link>{" "}
        (any balance) — this screen only lists accounts past {OVERDUE_DAYS} days with a balance.
      </p>
      {overdue.length === 0 ? (
        <EmptyState title="No overdue customers" body="All customers are up to date." />
      ) : (
        <Card>
          <CardContent className="p-0 px-4">
            {overdue.map((c) => (
              <ListRow
                key={c.id}
                left={c.name}
                right={npr(c.outstanding)}
                sub={`oldest ${c.oldestBillDays}d · ${c.area}`}
                onClick={() => navigate(`/app/payments/new?customerId=${c.id}`)}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
};
