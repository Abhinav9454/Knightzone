import { BarChart3 } from "lucide-react";

import { ComingSoonState } from "@/components/ComingSoonState";

export default function Analytics() {
  return (
    <ComingSoonState
      title="Placement Analytics"
      description="Hiring funnel analytics, conversion tracking, and placement insights are being wired to live data."
      note="Where analytics actions were not fully working, the page now clearly shows coming soon instead of dead widgets."
      icon={BarChart3}
    />
  );
}
