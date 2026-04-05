import { useRequestStore } from "@/stores/useRequestStore";
import { KeyValueEditor } from "@/components/shared/KeyValueEditor";

export function ParamsPanel() {
  const { params, setParams } = useRequestStore();

  return (
    <KeyValueEditor
      items={params}
      onChange={setParams}
      keyPlaceholder="키"
      valuePlaceholder="값"
      addLabel="+ 파라미터 추가"
    />
  );
}
