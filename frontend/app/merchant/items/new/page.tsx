"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { MerchantHeader } from "@/app/merchant/dashboard/page";
import ItemForm from "@/components/merchant/ItemForm";

function NewItemContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MerchantHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add new item</h1>
        <ItemForm mode="create" />
      </main>
    </div>
  );
}

export default function NewItemPage() {
  return (
    <ProtectedRoute allowedRoles={["MERCHANT"]}>
      <NewItemContent />
    </ProtectedRoute>
  );
}
