import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Topbar from "../components/Topbar";
import BatchTable from "../components/BatchTable";
import api from "../services/api";

export default function BatchesPage() {
  const { openSidebar } = useOutletContext();
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    api.get("/batches").then((response) => setBatches(response.data));
  }, []);

  return (
    <div>
      <Topbar
        title="Batch Produksi"
        subtitle="Kelola seluruh batch produksi, cek tahapan aktif, dan masuk ke detail jalur multi-path setiap batch."
        onOpenMenu={openSidebar}
      />
      <div className="p-4 lg:p-8">
        <BatchTable batches={batches} />
      </div>
    </div>
  );
}
