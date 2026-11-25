import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "@/components/Layout";
import { detectLang } from "@/i18n";
import Home from "@/pages/Home";
import StaticPage, { NotFound } from "@/pages/StaticPage";
import { AuthProvider } from "@/lib/auth";

const ChartPage = lazy(() => import("@/pages/ChartPage"));
const ReadingPage = lazy(() => import("@/pages/ReadingPage"));
const CoupleFormPage = lazy(() => import("@/pages/CouplePage").then((m) => ({ default: m.CoupleFormPage })));
const CoupleResultPage = lazy(() => import("@/pages/CouplePage").then((m) => ({ default: m.CoupleResultPage })));
const TodayPage = lazy(() => import("@/pages/TodayPage"));
const MoonPage = lazy(() => import("@/pages/MoonPage"));
const FullMoonPage = lazy(() => import("@/pages/FullMoonPage"));
const YearFormPage = lazy(() => import("@/pages/YearPage").then((m) => ({ default: m.YearFormPage })));
const YearResultPage = lazy(() => import("@/pages/YearPage").then((m) => ({ default: m.YearResultPage })));
const NumFormPage = lazy(() => import("@/pages/NumerologyPage").then((m) => ({ default: m.NumFormPage })));
const NumResultPage = lazy(() => import("@/pages/NumerologyPage").then((m) => ({ default: m.NumResultPage })));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const AccountPage = lazy(() => import("@/pages/AccountPage"));
const PaymentSuccess = lazy(() => import("@/pages/PaymentPage").then((m) => ({ default: m.PaymentSuccess })));
const PaymentFailed = lazy(() => import("@/pages/PaymentPage").then((m) => ({ default: m.PaymentFailed })));

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <AuthProvider>
      <Suspense fallback={<div className="min-h-screen" />}>
        <Routes>
          <Route path="/" element={<Navigate to={`/${detectLang()}`} replace />} />
          <Route path="/:lang" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="chart/:code" element={<ChartPage />} />
            <Route path="today" element={<TodayPage />} />
            <Route path="moon" element={<MoonPage />} />
            <Route path="full-moon" element={<FullMoonPage />} />
            <Route path="year" element={<YearFormPage />} />
            <Route path="year/:date" element={<YearResultPage />} />
            <Route path="numerology" element={<NumFormPage />} />
            <Route path="numerology/:code" element={<NumResultPage />} />
            <Route path="couple" element={<CoupleFormPage />} />
            <Route path="couple/:a/:b" element={<CoupleResultPage />} />
            <Route path="reading/:orderId" element={<ReadingPage />} />
            <Route path="payment/success" element={<PaymentSuccess />} />
            <Route path="payment/failed" element={<PaymentFailed />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="page/:slug" element={<StaticPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
