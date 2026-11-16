import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "@/components/Layout";
import { detectLang } from "@/i18n";
import Home from "@/pages/Home";
import StaticPage, { NotFound } from "@/pages/StaticPage";

const ChartPage = lazy(() => import("@/pages/ChartPage"));
const ReadingPage = lazy(() => import("@/pages/ReadingPage"));
const CoupleFormPage = lazy(() => import("@/pages/CouplePage").then((m) => ({ default: m.CoupleFormPage })));
const CoupleResultPage = lazy(() => import("@/pages/CouplePage").then((m) => ({ default: m.CoupleResultPage })));
const PaymentSuccess = lazy(() => import("@/pages/PaymentPage").then((m) => ({ default: m.PaymentSuccess })));
const PaymentFailed = lazy(() => import("@/pages/PaymentPage").then((m) => ({ default: m.PaymentFailed })));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen" />}>
        <Routes>
          <Route path="/" element={<Navigate to={`/${detectLang()}`} replace />} />
          <Route path="/:lang" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="chart/:code" element={<ChartPage />} />
            <Route path="couple" element={<CoupleFormPage />} />
            <Route path="couple/:a/:b" element={<CoupleResultPage />} />
            <Route path="reading/:orderId" element={<ReadingPage />} />
            <Route path="payment/success" element={<PaymentSuccess />} />
            <Route path="payment/failed" element={<PaymentFailed />} />
            <Route path="page/:slug" element={<StaticPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
