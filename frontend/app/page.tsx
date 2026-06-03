"use client";

import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">NutriEats</h1>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="secondary">Log in</Button>
            </Link>
            <Link href="/register">
              <Button>Sign up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
        <h2 className="text-5xl font-bold mb-4">Eat what you love. Know what you eat.</h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          NutriEats is a food delivery platform that combines convenience with health transparency.
          Every dish shows its full nutritional breakdown, helping you make informed choices.
        </p>
        <Link href="/register">
          <Button className="text-lg px-8 py-4">Get Started</Button>
        </Link>
      </section>

      {/* Feature Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="text-4xl mb-3">🥗</div>
          <h3 className="text-xl font-semibold mb-2">Health Transparency</h3>
          <p className="text-gray-600">
            Every item shows calories, macros, ingredients, and how it's made — no guesswork.
          </p>
        </Card>

        <Card className="p-6">
          <div className="text-4xl mb-3">🎯</div>
          <h3 className="text-xl font-semibold mb-2">Personal RDA Tracking</h3>
          <p className="text-gray-600">
            Set your daily targets based on your BMR, and track nutrients in real time.
          </p>
        </Card>

        <Card className="p-6">
          <div className="text-4xl mb-3">⚡</div>
          <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
          <p className="text-gray-600">
            Order from top restaurants with the same speed and convenience you expect.
          </p>
        </Card>
      </section>

      {/* Sample Health Badge Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <h3 className="text-2xl font-bold mb-6 text-center">Clear Health Labels</h3>
        <div className="flex justify-center gap-6">
          <Card className="p-6 text-center">
            <Badge color="green" size="md">Healthy</Badge>
            <p className="mt-3 text-sm text-gray-600">Low fat, high fiber, nutritious</p>
          </Card>
          <Card className="p-6 text-center">
            <Badge color="orange" size="md">Indulgent</Badge>
            <p className="mt-3 text-sm text-gray-600">High calories, deep fried, treat yourself</p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} NutriEats. Built with Next.js, Express, Prisma, and PostgreSQL.</p>
          <p className="mt-2">
            <Link href="/merchant/login" className="text-green-600 hover:underline">Merchant Login</Link>
            {" • "}
            <Link href="/rider/login" className="text-green-600 hover:underline">Rider Login</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
