import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterGate } from "@/pages/RegisterGate";
import { PendingApprovalPage } from "@/pages/PendingApprovalPage";
import { LicenseExpiredPage } from "@/pages/LicenseExpiredPage";
import { NoTenantPage } from "@/pages/NoTenantPage";
import { HomePage } from "@/pages/home/HomePage";
import { AgingDetailPage } from "@/pages/home/AgingDetailPage";
import { OverduePage } from "@/pages/home/OverduePage";
import { OutstandingBillsPage } from "@/pages/home/OutstandingBillsPage";
import { PeriodListPage } from "@/pages/home/PeriodListPage";
import { SaleEntryPage } from "@/pages/sales/SaleEntryPage";
import { PaymentPage } from "@/pages/payments/PaymentPage";
import { ReturnPage } from "@/pages/returns/ReturnPage";
import { DamagePage } from "@/pages/damage/DamagePage";
import { PurchasesPage } from "@/pages/purchases/PurchasesPage";
import { PurchasePage } from "@/pages/purchases/PurchasePage";
import { PurchaseDetailPage } from "@/pages/purchases/PurchaseDetailPage";
import { SupplierPaymentPage } from "@/pages/supplier-payment/SupplierPaymentPage";
import { ExpensePage } from "@/pages/expense/ExpensePage";
import { DailyCashPage } from "@/pages/daily-cash/DailyCashPage";
import { SchemePage } from "@/pages/scheme/SchemePage";
import { ProductsPage } from "@/pages/products/ProductsPage";
import { CustomersPage } from "@/pages/customers/CustomersPage";
import { CustomerDetailPage } from "@/pages/customers/CustomerDetailPage";
import { CustomerFormPage } from "@/pages/customers/CustomerFormPage";
import { SuppliersPage } from "@/pages/suppliers/SuppliersPage";
import { SupplierFormPage } from "@/pages/suppliers/SupplierFormPage";
import { SupplierDetailPage } from "@/pages/suppliers/SupplierDetailPage";
import { SupplierInvoicesPage } from "@/pages/suppliers/SupplierInvoicesPage";
import { StockAdjustmentPage } from "@/pages/stock/StockAdjustmentPage";
import { MrpStickerListPage } from "@/pages/mrp/MrpStickerListPage";
import { MrpStickerDesignerPage } from "@/pages/mrp/MrpStickerDesignerPage";
import { ReportsHubPage } from "@/pages/reports/ReportsHubPage";
import { SupportPage } from "@/pages/support/SupportPage";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { ArchivesPage } from "@/pages/archives/ArchivesPage";
import { CompanyOverviewPage } from "@/pages/company/CompanyOverviewPage";
import { CapitalListPage } from "@/pages/company/CapitalListPage";
import { CapitalEntryPage } from "@/pages/company/CapitalEntryPage";
import { BillDetailPage } from "@/pages/bills/BillDetailPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { ProductFormPage } from "@/pages/products/ProductFormPage";
import { ProductDetailPage } from "@/pages/products/ProductDetailPage";
import { ProtectedRoute } from "@/lib/auth";
import { PublicHomeGate } from "@/pages/marketing/PublicHomeGate";
import { PrivacyPage } from "@/pages/marketing/PrivacyPage";
import { TermsPage } from "@/pages/marketing/TermsPage";
import { FaqPage } from "@/pages/marketing/FaqPage";
import { MarketingContactPage } from "@/pages/marketing/MarketingContactPage";

const AppRoutesInner = () => (
  <Routes>
    <Route path="/" element={<PublicHomeGate />} />
    <Route path="/privacy" element={<PrivacyPage />} />
    <Route path="/terms" element={<TermsPage />} />
    <Route path="/faq" element={<FaqPage />} />
    <Route path="/contact" element={<MarketingContactPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterGate />} />
    <Route path="/pending-approval" element={<PendingApprovalPage />} />
    <Route path="/license-expired" element={<LicenseExpiredPage />} />
    <Route path="/no-tenant" element={<NoTenantPage />} />

    <Route
      path="/app"
      element={
        <ProtectedRoute>
          <AppShell />
        </ProtectedRoute>
      }
    >
      <Route index element={<Navigate to="home" replace />} />
      <Route path="home" element={<HomePage />} />
      <Route path="home/aging/:bucket" element={<AgingDetailPage />} />
      <Route path="home/overdue" element={<OverduePage />} />
      <Route path="home/outstanding" element={<OutstandingBillsPage />} />
      <Route path="home/period/:type" element={<PeriodListPage />} />
      <Route path="sales/new" element={<SaleEntryPage />} />
      <Route path="sales/edit/:billNo" element={<SaleEntryPage />} />
      <Route path="payments/new" element={<PaymentPage />} />
      <Route path="returns/new" element={<ReturnPage />} />
      <Route path="damages/new" element={<DamagePage />} />
      <Route path="purchases" element={<PurchasesPage />} />
      <Route path="purchases/new" element={<PurchasePage />} />
      <Route path="purchases/edit/:purchaseId" element={<PurchasePage />} />
      <Route path="purchases/:purchaseId" element={<PurchaseDetailPage />} />
      <Route path="supplier-payments/new" element={<SupplierPaymentPage />} />
      <Route path="expenses/new" element={<ExpensePage />} />
      <Route path="daily-cash" element={<DailyCashPage />} />
      <Route path="schemes/new" element={<SchemePage />} />
      <Route path="bills/:billNo" element={<BillDetailPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="products" element={<ProductsPage />} />
      <Route path="products/new" element={<ProductFormPage />} />
      <Route path="products/edit/:productId" element={<ProductFormPage />} />
      <Route path="products/:productId" element={<ProductDetailPage />} />
      <Route path="customers/new" element={<CustomerFormPage />} />
      <Route path="customers/edit/:customerId" element={<CustomerFormPage />} />
      <Route path="customers/:id" element={<CustomerDetailPage />} />
      <Route path="customers" element={<CustomersPage />} />
      <Route path="suppliers" element={<SuppliersPage />} />
      <Route path="suppliers/new" element={<SupplierFormPage />} />
      <Route path="suppliers/edit/:supplierId" element={<SupplierFormPage />} />
      <Route path="suppliers/:supplierId/invoices" element={<SupplierInvoicesPage />} />
      <Route path="suppliers/:supplierId" element={<SupplierDetailPage />} />
      <Route path="stock-adjustment/new" element={<StockAdjustmentPage />} />
      <Route path="mrp-stickers" element={<MrpStickerListPage />} />
      <Route path="mrp-stickers/new" element={<MrpStickerDesignerPage />} />
      <Route path="mrp-stickers/edit/:designId" element={<MrpStickerDesignerPage />} />
      <Route path="stock" element={<Navigate to="/app/products" replace />} />
      <Route path="company" element={<CompanyOverviewPage />} />
      <Route path="capital" element={<CapitalListPage />} />
      <Route path="capital/new" element={<CapitalEntryPage />} />
      <Route path="reports" element={<ReportsHubPage />} />
      <Route path="support" element={<SupportPage />} />
      <Route path="more" element={<Navigate to="/app/reports" replace />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="archives" element={<ArchivesPage />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export const AppRouter = () => (
  <BrowserRouter>
    <AppRoutesInner />
  </BrowserRouter>
);
