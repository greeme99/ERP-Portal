import MasterCrudPage from "../../components/common/MasterCrudPage";
import { materialStore } from "../../data/mock/master";
import { nextId } from "../../services/store";

export default function MaterialMaster() {
  return (
    <MasterCrudPage
      moduleLabel="12. 기준정보 (Master Data)"
      title="품목마스터"
      store={materialStore}
      newRow={() => ({ id: nextId("MAT"), code: "", name: "", type: "원자재", uom: "EA", price: 0, labor: 0, stock: 0, safety: 0, status: "사용" })}
      fields={[
        { key: "code", label: "품목코드", required: true },
        { key: "name", label: "품목명", required: true },
        { key: "type", label: "품목유형", type: "select", options: ["완제품", "반제품", "원자재", "부자재"] },
        { key: "uom", label: "단위", type: "select", options: ["EA", "KG", "M", "SET"] },
        { key: "price", label: "단가(원)", type: "number", align: "right" },
        { key: "labor", label: "가공비(원)", type: "number", align: "right" },
        { key: "stock", label: "현재고", type: "number", align: "right" },
        { key: "safety", label: "안전재고", type: "number", align: "right" },
        {
          key: "status", label: "상태", type: "select", options: ["사용", "중지"],
          render: (r) => (
            <span className={r.status === "사용" ? "text-emerald-500 font-semibold" : "text-red-500 font-semibold"}>{r.status}</span>
          ),
        },
      ]}
    />
  );
}
