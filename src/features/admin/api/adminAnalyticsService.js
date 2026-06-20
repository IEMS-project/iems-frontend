import { iamService } from "@/features/admin/api/iamService";
import { adminPaymentService } from "@/features/admin/api/adminPaymentService";
import { projectService } from "@/features/projects/api/projectService";

export async function getAdminAnalyticsData() {
  const [accountsPage, paymentsPage, projects] = await Promise.all([
    iamService.getAdminAccounts({ page: 0, size: 1000 }),
    adminPaymentService.getPayments({ page: 0, size: 1000, sort: "createdAt,desc" }),
    projectService.getProjectsTable(),
  ]);

  return {
    accounts: accountsPage?.items || [],
    totalAccounts: accountsPage?.totalElements || accountsPage?.items?.length || 0,
    payments: paymentsPage?.content || paymentsPage?.items || [],
    totalPayments: paymentsPage?.totalElements || paymentsPage?.content?.length || 0,
    projects: Array.isArray(projects) ? projects : [],
  };
}
