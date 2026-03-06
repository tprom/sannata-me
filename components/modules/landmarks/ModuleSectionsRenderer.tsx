import UniversalSectionsRenderer from "@/components/modules/landmarks/UniversalSectionsRenderer";
import type { UniversalPageEnvelope } from "@/lib/universal-page-template/types";

type Props = {
  envelope: UniversalPageEnvelope;
};

export default function ModuleSectionsRenderer({ envelope }: Props) {
  return <UniversalSectionsRenderer envelope={envelope} />;
}
