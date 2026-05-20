import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import BatchesPage from "./pages/BatchesPage";
import NewBatchPage from "./pages/NewBatchPage";
import BatchDetailPage from "./pages/BatchDetailPage";
import StageFormPage from "./pages/StageFormPage";
import TraceabilityPage from "./pages/TraceabilityPage";
import PublicTraceabilityPage from "./pages/PublicTraceabilityPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/trace/:id", element: <PublicTraceabilityPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "batches", element: <BatchesPage /> },
          { path: "batches/new", element: <NewBatchPage /> },
          { path: "batches/:id", element: <BatchDetailPage /> },
          { path: "batches/:id/stages/:stageName", element: <StageFormPage /> },
          { path: "traceability", element: <TraceabilityPage /> },
          { path: "reports", element: <ReportsPage /> },
          { path: "settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </LanguageProvider>
  );
}
