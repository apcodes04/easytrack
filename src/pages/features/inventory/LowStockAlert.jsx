import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useOrg } from "../../../hooks/useOrg";
import { getLowStockAlerts } from "../../../services/inventoryService";
import { AlertTriangle, Package } from "lucide-react";

export default function LowStockAlert() {
  const { projectId } = useParams();
  const { org } = useOrg();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!org) return;
    const scopeId = `${org.id}_${projectId}`;
    getLowStockAlerts(scopeId).then((a) => {
      setAlerts(a);
      setLoading(false);
    });
  }, [org, projectId]);

  if (loading) return <div className="flex justify-center p-8"><div className="animate-spin h-8 w-8 rounded-full border-b-2 border-orange-500" /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <AlertTriangle className="text-red-500 w-5 h-5" /> Low Stock Alerts
      </h1>

      {alerts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <Package className="w-10 h-10 text-green-300 mx-auto mb-2" />
          <p className="text-green-600 font-medium">All stock levels are OK</p>
          <p className="text-gray-400 text-xs mt-1">No materials are below their alert threshold.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <div key={i} className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 rounded-lg p-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="font-semibold text-red-700">{alert.materialName}</p>
                  <p className="text-xs text-red-500">
                    Current: <span className="font-bold">{alert.current} {alert.unit}</span> · Alert below: {alert.limit} {alert.unit}
                  </p>
                </div>
              </div>
              <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">LOW STOCK</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
