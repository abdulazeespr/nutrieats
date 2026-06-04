"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface FlashOfferItem {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  discount: number;
  flashDealUntil: string;
  restaurant: {
    id: string;
    name: string;
  };
}

interface FlashOfferStripProps {
  offers: FlashOfferItem[];
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const end = new Date(expiresAt).getTime();
      const diff = Math.max(0, end - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <span className="text-xs font-bold text-red-600">
      ⏱ {timeLeft}
    </span>
  );
}

export default function FlashOfferStrip({ offers }: FlashOfferStripProps) {
  if (offers.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold text-gray-900">⚡ Flash Offers</h2>
        <Badge color="red" size="sm">
          Limited Time
        </Badge>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide">
        {offers.map((offer) => {
          const discountedPrice = offer.price * (1 - offer.discount / 100);

          return (
            <Link
              key={offer.id}
              href={`/menu-items/${offer.id}`}
              className="shrink-0 w-64 snap-start focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-2xl"
            >
              <Card className="overflow-hidden hover:shadow-md transition-shadow border-red-200">
                <div className="relative w-full h-32 bg-gray-100">
                  {offer.imageUrl ? (
                    <Image
                      src={offer.imageUrl}
                      alt={offer.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      🍽️
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge color="red" size="sm">
                      {offer.discount}% OFF
                    </Badge>
                  </div>
                </div>

                <div className="p-3">
                  <h3 className="text-sm font-bold text-gray-900 line-clamp-2 mb-1">
                    {offer.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">
                    {offer.restaurant.name}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-bold text-red-700">
                        ₹{discountedPrice.toFixed(0)}
                      </span>
                      <span className="text-xs text-gray-400 line-through">
                        ₹{offer.price.toFixed(0)}
                      </span>
                    </div>
                    <CountdownTimer expiresAt={offer.flashDealUntil} />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
