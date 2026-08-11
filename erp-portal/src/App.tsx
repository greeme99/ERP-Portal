import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import ScaffoldPage from "./pages/ScaffoldPage";
// Dashboards
import ExecutiveKpiAnalytics from "./pages/dashboard/ExecutiveKpiAnalytics";
import ManufacturingRealtimeControl from "./pages/dashboard/ManufacturingRealtimeControl";
import GlobalSupplyChainMap from "./pages/dashboard/GlobalSupplyChainMap";
import EsgCarbonManagement from "./pages/dashboard/EsgCarbonManagement";
import AiAnomalyDetectionControl from "./pages/dashboard/AiAnomalyDetectionControl";
import GlobalComplianceLegal from "./pages/dashboard/GlobalComplianceLegal";
// MDM
import MaterialMaster from "./pages/mdm/MaterialMaster";
import BomMaster from "./pages/mdm/BomMaster";
import PartnerMaster from "./pages/mdm/PartnerMaster";
import WorkCenterMaster from "./pages/mdm/WorkCenterMaster";
import WarehouseMaster from "./pages/mdm/WarehouseMaster";
import SupplierMaster from "./pages/mdm/SupplierMaster";
import PlantMaster from "./pages/mdm/PlantMaster";
import EquipmentMaster from "./pages/mdm/EquipmentMaster";
import GlAccountMaster from "./pages/mdm/GlAccountMaster";
import FxRateMaster from "./pages/mdm/FxRateMaster";
import OrgMaster from "./pages/mdm/OrgMaster";
// SD
import CustomerMaster from "./pages/sd/CustomerMaster";
import QuotationPage from "./pages/sd/QuotationPage";
import SalesOrderPage from "./pages/sd/SalesOrderPage";
import SalesPricing from "./pages/sd/SalesPricing";
import SalesContract from "./pages/sd/SalesContract";
import SalesBacklog from "./pages/sd/SalesBacklog";
import DeliveryStatus from "./pages/sd/DeliveryStatus";
import SalesReturn from "./pages/sd/SalesReturn";
import SalesCreditCollection from "./pages/sd/SalesCreditCollection";
import SalesOpportunity from "./pages/sd/SalesOpportunity";
import SalesPerformance from "./pages/sd/SalesPerformance";
import CustomerProfitability from "./pages/sd/CustomerProfitability";
import SalesAnalytics from "./pages/sd/SalesAnalytics";
import AtpPromising from "./pages/sd/AtpPromising";
import SalesIncentive from "./pages/sd/SalesIncentive";
// MM
import VendorEval from "./pages/mm/VendorEval";
import PoApproval from "./pages/mm/PoApproval";
import PurchaseRequest from "./pages/mm/PurchaseRequest";
import PurchaseOrder from "./pages/mm/PurchaseOrder";
import SubcontractProcurement from "./pages/mm/SubcontractProcurement";
import SubcontractSettlement from "./pages/mm/SubcontractSettlement";
import RawMaterialProcurement from "./pages/mm/RawMaterialProcurement";
import SupplierPortal from "./pages/mm/SupplierPortal";
// LE
import GoodsReceipt from "./pages/le/GoodsReceipt";
import GoodsIssue from "./pages/le/GoodsIssue";
import StockLedger from "./pages/le/StockLedger";
import StockMove from "./pages/le/StockMove";
import LotManagement from "./pages/le/LotManagement";
import PhysicalInventory from "./pages/le/PhysicalInventory";
import PickingPacking from "./pages/le/PickingPacking";
import TransportationManagement from "./pages/le/TransportationManagement";
import WarehouseLocationManagement from "./pages/le/WarehouseLocationManagement";
import CustomsManagement from "./pages/le/CustomsManagement";
// PP
import PpDashboardMaster from "./pages/pp/PpDashboardMaster";
import MpsPage from "./pages/pp/MpsPage";
import MrpPage from "./pages/pp/MrpPage";
import ProcessControl from "./pages/pp/ProcessControl";
import RoutingMaster from "./pages/pp/RoutingMaster";
import WorkOrderPage from "./pages/pp/WorkOrderPage";
import ProcessExecution from "./pages/pp/ProcessExecution";
import CapacityAnalytics from "./pages/pp/CapacityAnalytics";
import EquipmentManagement from "./pages/pp/EquipmentManagement";
import ReworkManagement from "./pages/pp/ReworkManagement";
// QM
import InspectionStandards from "./pages/qm/InspectionStandards";
import IncomingInspection from "./pages/qm/IncomingInspection";
import SpcPage from "./pages/qm/SpcPage";
import ProcessInspection from "./pages/qm/ProcessInspection";
import OutgoingInspection from "./pages/qm/OutgoingInspection";
import InspectionAnalytics from "./pages/qm/InspectionAnalytics";
import ProcessCapability from "./pages/qm/ProcessCapability";
import Nonconformance from "./pages/qm/Nonconformance";
import EightDReport from "./pages/qm/EightDReport";
import GaugeManagement from "./pages/qm/GaugeManagement";
import CapaPage from "./pages/qm/CapaPage";
import CustomerClaim from "./pages/qm/CustomerClaim";
import InspectionEquipmentLog from "./pages/qm/InspectionEquipmentLog";
// SCM
import ControlTower from "./pages/scm/ControlTower";
import DemandForecast from "./pages/scm/DemandForecast";
import Sop from "./pages/scm/Sop";
import SupplyPlanning from "./pages/scm/SupplyPlanning";
import PartnerScmIntegration from "./pages/scm/PartnerScmIntegration";
import InventoryPlan from "./pages/scm/InventoryPlan";
import RiskManagement from "./pages/scm/RiskManagement";
import SupplySimulation from "./pages/scm/SupplySimulation";
// FI
import JournalEntry from "./pages/fi/JournalEntry";
import FiBudgetManagement from "./pages/fi/FiBudgetManagement";
import ArPage from "./pages/fi/ArPage";
import ApPage from "./pages/fi/ApPage";
import CashManagement from "./pages/fi/CashManagement";
import FixedAssets from "./pages/fi/FixedAssets";
import PeriodClosing from "./pages/fi/PeriodClosing";
import FinancialStatement from "./pages/fi/FinancialStatement";
import TaxManagement from "./pages/fi/TaxManagement";
import FxRiskManagement from "./pages/fi/FxRiskManagement";
import FinancialLoanManagement from "./pages/fi/FinancialLoanManagement";
import ShareholderManagement from "./pages/fi/ShareholderManagement";
import IfrsAuditManagement from "./pages/fi/IfrsAuditManagement";
// CO
import CostElementMaster from "./pages/co/CostElementMaster";
import CostCenterMaster from "./pages/co/CostCenterMaster";
import ProfitCenterMaster from "./pages/co/ProfitCenterMaster";
import MfgCost from "./pages/co/MfgCost";
import CostAllocationDistribution from "./pages/co/CostAllocationDistribution";
import AbcCostAnalytics from "./pages/co/AbcCostAnalytics";
import VarianceAnalysis from "./pages/co/VarianceAnalysis";
import BudgetPlan from "./pages/co/BudgetPlan";
import Copa from "./pages/co/Copa";
import CostAllocation from "./pages/co/CostAllocation";
import ProfitAnalysis from "./pages/co/ProfitAnalysis";
import TargetCostSimulation from "./pages/co/TargetCostSimulation";
// PLM
import ProjectManagement from "./pages/plm/ProjectManagement";
import ProductSpec from "./pages/plm/ProductSpec";
import EcoManagement from "./pages/plm/EcoManagement";
import DrawingManagement from "./pages/plm/DrawingManagement";
import ComponentStandardization from "./pages/plm/ComponentStandardization";
import TechDocumentManagement from "./pages/plm/TechDocumentManagement";
import PartHistory from "./pages/plm/PartHistory";
import ProtoQuality from "./pages/plm/ProtoQuality";
import PrototypeManagement from "./pages/plm/PrototypeManagement";
import BomStructureAnalysis from "./pages/plm/BomStructureAnalysis";
// SV
import AsDispatchScheduling from "./pages/sv/AsDispatchScheduling";
import AsRepair from "./pages/sv/AsRepair";
import SparePartsStock from "./pages/sv/SparePartsStock";
import VocManagement from "./pages/sv/VocManagement";
import WarrantyPage from "./pages/sv/WarrantyPage";
import ServiceCost from "./pages/sv/ServiceCost";
import CustomerSatisfaction from "./pages/sv/CustomerSatisfaction";
import FieldServiceAiSupport from "./pages/sv/FieldServiceAiSupport";
import FieldServiceLocationMapping from "./pages/sv/FieldServiceLocationMapping";
import ServicePartSafetyStock from "./pages/sv/ServicePartSafetyStock";
import WarrantyRepairAnalytics from "./pages/sv/WarrantyRepairAnalytics";
import RevisitRepairAnalysis from "./pages/sv/RevisitRepairAnalysis";
import ServiceVehicleToolManagement from "./pages/sv/ServiceVehicleToolManagement";
// COM
import UserManagement from "./pages/com/UserManagement";
import PermissionMatrix from "./pages/com/PermissionMatrix";
import OrganizationManagement from "./pages/com/OrganizationManagement";
import ApprovalInbox from "./pages/com/ApprovalInbox";
import RoleMasterManagement from "./pages/com/RoleMasterManagement";
import CommonCodeMaster from "./pages/com/CommonCodeMaster";
import BatchJobManagement from "./pages/com/BatchJobManagement";
import NotificationCenter from "./pages/com/NotificationCenter";
import AuditLogs from "./pages/com/AuditLogs";
import SystemHealth from "./pages/com/SystemHealth";
import AiAgentManagement from "./pages/com/AiAgentManagement";
import NoticeBoardManagement from "./pages/com/NoticeBoardManagement";
import WorkflowAutomation from "./pages/com/WorkflowAutomation";
import AgentOrchestration from "./pages/com/AgentOrchestration";
import UserAuditAnalytics from "./pages/com/UserAuditAnalytics";
import UserMenuPreference from "./pages/com/UserMenuPreference";
import ExternalEdiInterface from "./pages/com/ExternalEdiInterface";
import DataPrivacyManagement from "./pages/com/DataPrivacyManagement";
import MobileDeviceManagement from "./pages/com/MobileDeviceManagement";
import MultiCurrencyMaster from "./pages/com/MultiCurrencyMaster";
import HrPermissionMapping from "./pages/com/HrPermissionMapping";
import CompanyBranchMaster from "./pages/com/CompanyBranchMaster";
import DataBackupRecovery from "./pages/com/DataBackupRecovery";
import GlobalTimezoneMaster from "./pages/com/GlobalTimezoneMaster";
import DataRetentionPolicy from "./pages/com/DataRetentionPolicy";
import LicenseSubscriptionManagement from "./pages/com/LicenseSubscriptionManagement";
// MK
import MarketingStrategy from "./pages/mk/MarketingStrategy";
import CompetitorAnalysis from "./pages/mk/CompetitorAnalysis";
import ChannelAnalytics from "./pages/mk/ChannelAnalytics";
import CustomerSegmentation from "./pages/mk/CustomerSegmentation";
import CampaignManagement from "./pages/mk/CampaignManagement";
import MarketAnalysis from "./pages/mk/MarketAnalysis";
import MarketIntelligence from "./pages/mk/MarketIntelligence";
import RoiAnalysis from "./pages/mk/RoiAnalysis";
import BrandCommunication from "./pages/mk/BrandCommunication";
import SocialListeningVoc from "./pages/mk/SocialListeningVoc";
import RetailStorePopManagement from "./pages/mk/RetailStorePopManagement";
import CouponPromotionManagement from "./pages/mk/CouponPromotionManagement";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/executive-kpi" element={<ExecutiveKpiAnalytics />} />
        <Route path="/factory-control" element={<ManufacturingRealtimeControl />} />
        <Route path="/scm-map" element={<GlobalSupplyChainMap />} />
        <Route path="/esg-carbon" element={<EsgCarbonManagement />} />
        <Route path="/ai-anomaly" element={<AiAnomalyDetectionControl />} />
        <Route path="/global-compliance" element={<GlobalComplianceLegal />} />
        <Route path="/m/mdm/mdm-01" element={<MaterialMaster />} />
        <Route path="/m/mdm/mdm-02" element={<BomMaster />} />
        <Route path="/m/mdm/mdm-03" element={<PartnerMaster />} />
        <Route path="/m/mdm/mdm-04" element={<SupplierMaster />} />
        <Route path="/m/mdm/mdm-05" element={<WorkCenterMaster />} />
        <Route path="/m/mdm/mdm-06" element={<WarehouseMaster />} />
        <Route path="/m/mdm/mdm-07" element={<PlantMaster />} />
        <Route path="/m/mdm/mdm-08" element={<EquipmentMaster />} />
        <Route path="/m/mdm/mdm-09" element={<GlAccountMaster />} />
        <Route path="/m/mdm/mdm-10" element={<FxRateMaster />} />
        <Route path="/m/mdm/mdm-11" element={<OrgMaster />} />
        {/* MDM-12 공통코드 관리 — COM-06 시스템 코드 관리와 동일 대상이라 화면을 재사용한다 */}
        <Route path="/m/mdm/mdm-12" element={<CommonCodeMaster />} />
        <Route path="/m/sd/sd-01" element={<CustomerMaster />} />
        <Route path="/m/sd/sd-02" element={<SalesPricing />} />
        <Route path="/m/sd/sd-03" element={<QuotationPage />} />
        <Route path="/m/sd/sd-04" element={<SalesOrderPage />} />
        <Route path="/m/sd/sd-05" element={<SalesContract />} />
        <Route path="/m/sd/sd-06" element={<SalesBacklog />} />
        <Route path="/m/sd/sd-07" element={<DeliveryStatus />} />
        <Route path="/m/sd/sd-08" element={<SalesReturn />} />
        <Route path="/m/sd/sd-09" element={<SalesCreditCollection />} />
        <Route path="/m/sd/sd-10" element={<SalesOpportunity />} />
        <Route path="/m/sd/sd-11" element={<SalesPerformance />} />
        <Route path="/m/sd/sd-12" element={<CustomerProfitability />} />
        <Route path="/m/sd/sd-13" element={<SalesAnalytics />} />
        <Route path="/m/sd/sd-14" element={<AtpPromising />} />
        <Route path="/m/sd/sd-15" element={<SalesIncentive />} />
        <Route path="/m/mm/mm-02" element={<VendorEval />} />
        <Route path="/m/mm/mm-03" element={<PoApproval />} />
        <Route path="/m/mm/mm-04" element={<PurchaseRequest />} />
        <Route path="/m/mm/mm-05" element={<PurchaseOrder />} />
        <Route path="/m/mm/mm-06" element={<SubcontractProcurement />} />
        <Route path="/m/mm/mm-07" element={<SubcontractSettlement />} />
        <Route path="/m/mm/mm-08" element={<RawMaterialProcurement />} />
        <Route path="/m/mm/mm-09" element={<SupplierPortal />} />
        <Route path="/m/le/le-01" element={<GoodsReceipt />} />
        <Route path="/m/le/le-02" element={<GoodsIssue />} />
        <Route path="/m/le/le-03" element={<StockLedger />} />
        <Route path="/m/le/le-04" element={<StockMove />} />
        <Route path="/m/le/le-05" element={<LotManagement />} />
        <Route path="/m/le/le-06" element={<PhysicalInventory />} />
        <Route path="/m/le/le-07" element={<PickingPacking />} />
        <Route path="/m/le/le-08" element={<TransportationManagement />} />
        <Route path="/m/le/le-09" element={<WarehouseLocationManagement />} />
        <Route path="/m/le/le-10" element={<CustomsManagement />} />
        <Route path="/m/pp/pp-01" element={<PpDashboardMaster />} />
        <Route path="/m/pp/pp-02" element={<MpsPage />} />
        <Route path="/m/pp/pp-03" element={<MrpPage />} />
        <Route path="/m/pp/pp-04" element={<ProcessControl />} />
        <Route path="/m/pp/pp-05" element={<RoutingMaster />} />
        <Route path="/m/pp/pp-06" element={<WorkOrderPage />} />
        <Route path="/m/pp/pp-07" element={<ProcessExecution />} />
        <Route path="/m/pp/pp-08" element={<CapacityAnalytics />} />
        <Route path="/m/pp/pp-09" element={<EquipmentManagement />} />
        <Route path="/m/pp/pp-10" element={<ReworkManagement />} />
        <Route path="/m/qm/qm-01" element={<InspectionStandards />} />
        <Route path="/m/qm/qm-02" element={<IncomingInspection />} />
        <Route path="/m/qm/qm-03" element={<ProcessInspection />} />
        <Route path="/m/qm/qm-04" element={<OutgoingInspection />} />
        <Route path="/m/qm/qm-05" element={<InspectionAnalytics />} />
        <Route path="/m/qm/qm-06" element={<SpcPage />} />
        <Route path="/m/qm/qm-07" element={<ProcessCapability />} />
        <Route path="/m/qm/qm-08" element={<Nonconformance />} />
        <Route path="/m/qm/qm-09" element={<EightDReport />} />
        <Route path="/m/qm/qm-10" element={<GaugeManagement />} />
        <Route path="/m/qm/qm-11" element={<CapaPage />} />
        <Route path="/m/qm/qm-12" element={<CustomerClaim />} />
        <Route path="/m/qm/qm-13" element={<InspectionEquipmentLog />} />
        <Route path="/m/scm/scm-01" element={<DemandForecast />} />
        <Route path="/m/scm/scm-02" element={<Sop />} />
        <Route path="/m/scm/scm-03" element={<SupplyPlanning />} />
        <Route path="/m/scm/scm-04" element={<PartnerScmIntegration />} />
        <Route path="/m/scm/scm-05" element={<InventoryPlan />} />
        <Route path="/m/scm/scm-06" element={<RiskManagement />} />
        <Route path="/m/scm/scm-07" element={<ControlTower />} />
        <Route path="/m/scm/scm-08" element={<SupplySimulation />} />
        <Route path="/m/fi/fi-01" element={<JournalEntry />} />
        <Route path="/m/fi/fi-02" element={<FiBudgetManagement />} />
        <Route path="/m/fi/fi-03" element={<ArPage />} />
        <Route path="/m/fi/fi-04" element={<ApPage />} />
        <Route path="/m/fi/fi-05" element={<CashManagement />} />
        <Route path="/m/fi/fi-06" element={<FixedAssets />} />
        <Route path="/m/fi/fi-07" element={<PeriodClosing />} />
        <Route path="/m/fi/fi-08" element={<FinancialStatement />} />
        <Route path="/m/fi/fi-09" element={<TaxManagement />} />
        <Route path="/m/fi/fi-10" element={<FxRiskManagement />} />
        <Route path="/m/fi/fi-11" element={<FinancialLoanManagement />} />
        <Route path="/m/fi/fi-12" element={<ShareholderManagement />} />
        <Route path="/m/fi/fi-13" element={<IfrsAuditManagement />} />
        <Route path="/m/co/co-01" element={<CostElementMaster />} />
        <Route path="/m/co/co-02" element={<CostCenterMaster />} />
        <Route path="/m/co/co-03" element={<ProfitCenterMaster />} />
        <Route path="/m/co/co-04" element={<MfgCost />} />
        <Route path="/m/co/co-05" element={<CostAllocationDistribution />} />
        <Route path="/m/co/co-06" element={<AbcCostAnalytics />} />
        <Route path="/m/co/co-07" element={<VarianceAnalysis />} />
        <Route path="/m/co/co-08" element={<BudgetPlan />} />
        <Route path="/m/co/co-09" element={<CostAllocation />} />
        <Route path="/m/co/co-10" element={<Copa />} />
        <Route path="/m/co/co-11" element={<ProfitAnalysis />} />
        <Route path="/m/co/co-12" element={<ProfitAnalysis />} />
        <Route path="/m/co/co-13" element={<TargetCostSimulation />} />
        <Route path="/m/plm/plm-01" element={<ProjectManagement />} />
        <Route path="/m/plm/plm-02" element={<ProductSpec />} />
        <Route path="/m/plm/plm-03" element={<EcoManagement />} />
        <Route path="/m/plm/plm-04" element={<DrawingManagement />} />
        <Route path="/m/plm/plm-05" element={<ComponentStandardization />} />
        <Route path="/m/plm/plm-06" element={<TechDocumentManagement />} />
        <Route path="/m/plm/plm-07" element={<PartHistory />} />
        <Route path="/m/plm/plm-08" element={<ProtoQuality />} />
        <Route path="/m/plm/plm-09" element={<PrototypeManagement />} />
        <Route path="/m/plm/plm-10" element={<BomStructureAnalysis />} />
        <Route path="/m/sv/sv-01" element={<AsDispatchScheduling />} />
        <Route path="/m/sv/sv-02" element={<AsRepair />} />
        <Route path="/m/sv/sv-03" element={<SparePartsStock />} />
        <Route path="/m/sv/sv-04" element={<VocManagement />} />
        <Route path="/m/sv/sv-05" element={<WarrantyPage />} />
        <Route path="/m/sv/sv-06" element={<ServiceCost />} />
        <Route path="/m/sv/sv-07" element={<CustomerSatisfaction />} />
        <Route path="/m/sv/sv-08" element={<FieldServiceAiSupport />} />
        <Route path="/m/sv/sv-09" element={<FieldServiceLocationMapping />} />
        <Route path="/m/sv/sv-10" element={<ServicePartSafetyStock />} />
        <Route path="/m/sv/sv-11" element={<WarrantyRepairAnalytics />} />
        <Route path="/m/sv/sv-12" element={<RevisitRepairAnalysis />} />
        <Route path="/m/sv/sv-13" element={<ServiceVehicleToolManagement />} />
        <Route path="/m/com/com-01" element={<UserManagement />} />
        <Route path="/m/com/com-02" element={<PermissionMatrix />} />
        <Route path="/m/com/com-03" element={<OrganizationManagement />} />
        <Route path="/m/com/com-04" element={<ApprovalInbox />} />
        <Route path="/m/com/com-05" element={<RoleMasterManagement />} />
        <Route path="/m/com/com-06" element={<CommonCodeMaster />} />
        <Route path="/m/com/com-07" element={<BatchJobManagement />} />
        <Route path="/m/com/com-08" element={<NotificationCenter />} />
        <Route path="/m/com/com-09" element={<AuditLogs />} />
        <Route path="/m/com/com-10" element={<SystemHealth />} />
        <Route path="/m/com/com-11" element={<AiAgentManagement />} />
        <Route path="/m/com/com-12" element={<NoticeBoardManagement />} />
        <Route path="/m/com/com-13" element={<WorkflowAutomation />} />
        <Route path="/m/com/com-14" element={<AgentOrchestration />} />
        <Route path="/m/com/com-15" element={<UserAuditAnalytics />} />
        <Route path="/m/com/com-16" element={<UserMenuPreference />} />
        <Route path="/m/com/com-17" element={<ExternalEdiInterface />} />
        <Route path="/m/com/com-18" element={<DataPrivacyManagement />} />
        <Route path="/m/com/com-19" element={<MobileDeviceManagement />} />
        <Route path="/m/com/com-20" element={<MultiCurrencyMaster />} />
        <Route path="/m/com/com-21" element={<HrPermissionMapping />} />
        <Route path="/m/com/com-22" element={<CompanyBranchMaster />} />
        <Route path="/m/com/com-23" element={<DataBackupRecovery />} />
        <Route path="/m/com/com-24" element={<GlobalTimezoneMaster />} />
        <Route path="/m/com/com-25" element={<DataRetentionPolicy />} />
        <Route path="/m/com/com-26" element={<LicenseSubscriptionManagement />} />
        <Route path="/m/mk/mk-01" element={<MarketingStrategy />} />
        <Route path="/m/mk/mk-02" element={<CompetitorAnalysis />} />
        <Route path="/m/mk/mk-03" element={<ChannelAnalytics />} />
        <Route path="/m/mk/mk-04" element={<CustomerSegmentation />} />
        <Route path="/m/mk/mk-05" element={<CampaignManagement />} />
        <Route path="/m/mk/mk-06" element={<MarketAnalysis />} />
        <Route path="/m/mk/mk-07" element={<MarketIntelligence />} />
        <Route path="/m/mk/mk-08" element={<RoiAnalysis />} />
        <Route path="/m/mk/mk-09" element={<BrandCommunication />} />
        <Route path="/m/mk/mk-10" element={<SocialListeningVoc />} />
        <Route path="/m/mk/mk-11" element={<RetailStorePopManagement />} />
        <Route path="/m/mk/mk-12" element={<CouponPromotionManagement />} />
        <Route path="/m/:moduleId/:slug" element={<ScaffoldPage />} />
      </Route>
    </Routes>
  );
}
