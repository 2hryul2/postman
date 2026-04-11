import { useRequestStore } from "@/stores/useRequestStore";
import { KeyValueEditor } from "@/components/shared/KeyValueEditor";
import { COMMON_HEADER_SUGGESTIONS } from "@/lib/helpText";

export function HeadersPanel() {
  const { headers, setHeaders } = useRequestStore();

  return (
    <KeyValueEditor
      items={headers}
      onChange={setHeaders}
      keyPlaceholder="헤더 이름"
      valuePlaceholder="값"
      addLabel="+ 헤더 추가"
      keySuggestions={COMMON_HEADER_SUGGESTIONS}
    />
  );
}
