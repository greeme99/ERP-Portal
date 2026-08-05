import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import ScaffoldPage from "./pages/ScaffoldPage";
// MDM
import MaterialMaster from "./pages/mdm/MaterialMaster";
import BomMaster from "./pages/mdm/BomMaster";
import PartnerMaster from "./pages/mdm/PartnerMaster";
import WarehouseMaster from "./pages/mdm/WarehouseMaster";
// SD
import CustomerMaster from "./pages/sd/CustomerMaster";
import QuotationPage from "./pages/sd/QuotationPage";
import SalesOrderPage from "./pages/sd/SalesOrderPage";
// MM
import VendorEval from "./pages/mm/VendorEval";
import PurchaseRequest from "./pages/mm/PurchaseRequest";
import PurchaseOrder from "./pages/mm/PurchaseOrder";
// LE
import GoodsReceipt from "./pages/le/GoodsReceipt";
import GoodsIssue from "./pages/le/GoodsIssue";
import StockMove from "./pages/le/StockMove";
import LotManagement from "./pages/le/LotManagement";
// PP
import MpsPage from "./pages/pp/MpsPage";
import MrpPage from "./pages/pp/MrpPage";
import WorkOrderPage from "./pages/pp/WorkOrderPage";
// QM
import IncomingInspection from "./pages/qm/IncomingInspection";
import SpcPage from "./pages/qm/SpcPage";
import ProcessInspection from "./pages/qm/ProcessInspection";
import Nonconformance from "./pages/qm/Nonconformance";
import CapaPage from "./pages/qm/CapaPage";
// SCM
import ControlTower from "./pages/scm/ControlTower";
import DemandForecast from "./pages/scm/DemandForecast";
import Sop from "./pages/scm/Sop";
import InventoryPlan from "./pages/scm/InventoryPlan";
// FI
import JournalEntry from "./pages/fi/JournalEntry";
import ArPage from "./pages/fi/ArPage";
import ApPage from "./pages/fi/ApPage";
// CO
import MfgCost from "./pages/co/MfgCost";
import ProfitPage from "./pages/co/ProfitPage";
import BudgetPlan from "./pages/co/BudgetPlan";
import Copa from "./pages/co/Copa";
// PLM
import EcoManagement from "./pages/plm/EcoManagement";
import DrawingManagement from "./pages/plm/DrawingManagement";
import PrototypeManagement from "./pages/plm/PrototypeManagement";
// SV
import AsRepair from "./pages/sv/AsRepair";
import WarrantyPage from "./pages/sv/WarrantyPage";
// COM
import UserManagement from "./pages/com/UserManagement";
import PermissionMatrix from "./pages/com/PermissionMatrix";
import ApprovalInbox from "./pages/com/ApprovalInbox";
// FI 확장
import CashManagement from "./pages/fi/CashManagement";
import FinancialStatement from "./pages/fi/FinancialStatement";
// MK
import CampaignManagement from "./pages/mk/CampaignManagement";
import MarketAnalysis from "./pages/mk/MarketAnalysis";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/m/mdm/mdm-01" element={<MaterialMaster />} />
        <Route path="/m/mdm/mdm-02" element={<BomMaster />} />
        <Route path="/m/mdm/mdm-03" element={<PartnerMaster />} />
        <Route path="/m/mdm/mdm-06" element={<WarehouseMaster />} />
        <Route path="/m/sd/sd-01" element={<CustomerMaster />} />
        <Route path="/m/sd/sd-03" element={<QuotationPage />} />
        <Route path="/m/sd/sd-04" element={<SalesOrderPage />} />
        <Route path="/m/mm/mm-02" element={<VendorEval />} />
        <Route path="/m/mm/mm-04" element={<PurchaseRequest />} />
        <Route path="/m/mm/mm-05" element={<PurchaseOrder />} />
        <Route path="/m/le/le-01" element={<GoodsReceipt />} />
        <Route path="/m/le/le-02" element={<GoodsIssue />} />
        <Route path="/m/le/le-04" element={<StockMove />} />
        <Route path="/m/le/le-05" element={<LotManagement />} />
        <Route path="/m/pp/pp-02" element={<MpsPage />} />
        <Route path="/m/pp/pp-03" element={<MrpPage />} />
        <Route path="/m/pp/pp-06" element={<WorkOrderPage />} />
        <Route path="/m/qm/qm-02" element={<IncomingInspection />} />
        <Route path="/m/qm/qm-03" element={<ProcessInspection />} />
        <Route path="/m/qm/qm-06" element={<SpcPage />} />
        <Route path="/m/qm/qm-08" element={<Nonconformance />} />
        <Route path="/m/qm/qm-09" element={<Nonconformance />} />
        <Route path="/m/qm/qm-11" element={<CapaPage />} />
        <Route path="/m/scm/scm-01" element={<DemandForecast />} />
        <Route path="/m/scm/scm-02" element={<Sop />} />
        <Route path="/m/scm/scm-05" element={<InventoryPlan />} />
        <Route path="/m/scm/scm-07" element={<ControlTower />} />
        <Route path="/m/fi/fi-01" element={<JournalEntry />} />
        <Route path="/m/fi/fi-03" element={<ArPage />} />
        <Route path="/m/fi/fi-04" element={<ApPage />} />
        <Route path="/m/co/co-04" element={<MfgCost />} />
        <Route path="/m/co/co-08" element={<BudgetPlan />} />
        <Route path="/m/co/co-10" element={<Copa />} />
        <Route path="/m/co/co-11" element={<ProfitPage />} />
        <Route path="/m/plm/plm-03" element={<EcoManagement />} />
        <Route path="/m/plm/plm-04" element={<DrawingManagement />} />
        <Route path="/m/plm/plm-09" element={<PrototypeManagement />} />
        <Route path="/m/sv/sv-02" element={<AsRepair />} />
        <Route path="/m/sv/sv-05" element={<WarrantyPage />} />
        <Route path="/m/com/com-01" element={<UserManagement />} />
        <Route path="/m/com/com-02" element={<PermissionMatrix />} />
        <Route path="/m/com/com-04" element={<ApprovalInbox />} />
        <Route path="/m/fi/fi-05" element={<CashManagement />} />
        <Route path="/m/fi/fi-08" element={<FinancialStatement />} />
        <Route path="/m/mk/mk-05" element={<CampaignManagement />} />
        <Route path="/m/mk/mk-06" element={<MarketAnalysis />} />
        <Route path="/m/:moduleId/:slug" element={<ScaffoldPage />} />
      </Route>
    </Routes>
  );
}
