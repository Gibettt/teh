import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Topbar from "../components/Topbar";
import BatchTable from "../components/BatchTable";
import api from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";

export default function BatchesPage() {
  const { openSidebar } = useOutletContext();
  const { t } = useLanguage();
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    api.get("/batches").then((response) => setBatches(response.data));
  }, []);

  return (
    <div>
      <Topbar
        title={t("batches.title")}
        onOpenMenu={openSidebar}
      />
      <div className="p-3 sm:p-4 lg:p-8">
        <BatchTable batches={batches} />
      </div>
    </div>
  );
}
