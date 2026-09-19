import { School } from "lucide-react";

import { ComingSoonState } from "@/components/ComingSoonState";

export default function TPODashboard() {
  return (
    <ComingSoonState
      title="TPO Dashboard"
      description="Institution approval workflows, campus hiring controls, and reporting tools are not ready for full use yet."
      note="Instead of partial interactions failing, this page now clearly marks the module as coming soon."
      icon={School}
    />
  );
}
