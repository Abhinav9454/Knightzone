import { Building2 } from "lucide-react";

import { ComingSoonState } from "@/components/ComingSoonState";

export default function CompanyDashboard() {
  return (
    <ComingSoonState
      title="Company Placement Dashboard"
      description="Company-side job management, applicant review, and hiring pipeline controls are still being completed."
      note="This route now shows a proper coming-soon state so users do not land on a page with incomplete clickable actions."
      icon={Building2}
    />
  );
}
