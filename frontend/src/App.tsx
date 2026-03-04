import { Route, Routes } from "react-router";
import AppLayout from "@/components/AppLayout";
import Home from "@/pages/Home";
import ProfileDetail from "@/pages/ProfileDetail";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/profiles/:id" element={<ProfileDetail />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
