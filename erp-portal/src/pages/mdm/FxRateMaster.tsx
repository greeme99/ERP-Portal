// MDM-10 환율 관리 — 통화별 일자 고시 환율 이력 (통화 마스터 자체는 COM-20)
import MasterCrudPage from "../../components/common/MasterCrudPage";
import { fxRateStore } from "../../data/mock/master";
import { nextId } from "../../services/store";

export default function FxRateMaster() {
  return (
    <MasterCrudPage
      moduleLabel="12. 기준정보 (Master Data)"
      title="환율관리"
      store={fxRateStore}
      searchKeys={["currency", "rateDate", "source"]}
      keyOf={(r) => `${r.currency}|${r.rateDate}|${r.quoteSeq}`}
      keyLabel="통화+기준일+고시회차"
      newRow={() => ({ id: nextId("FX"), currency: "USD", rateDate: "", baseRate: 0, buyRate: 0, sellRate: 0, quoteSeq: 1, source: "서울외국환중개" })}
      fields={[
        { key: "currency", label: "통화코드", required: true, type: "select", options: ["USD", "EUR", "JPY", "CNY", "VND"] },
        { key: "rateDate", label: "기준일", required: true, type: "date" },
        { key: "quoteSeq", label: "고시회차", type: "number", align: "right", required: true },
        { key: "baseRate", label: "매매기준율(KRW)", type: "number", align: "right" },
        { key: "buyRate", label: "송금보낼때(KRW)", type: "number", align: "right" },
        { key: "sellRate", label: "송금받을때(KRW)", type: "number", align: "right" },
        { key: "source", label: "고시출처" },
      ]}
    />
  );
}
