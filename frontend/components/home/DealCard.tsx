import Link from "next/link";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface DealCardProps {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  discount: number;
  calories: number;
  healthScore: number;
  isHealthy: boolean;
  restaurant: {
    id: string;
    name: string;
    address: string;
  };
}

export default function DealCard({ id, name, imageUrl, price, discount, calories, healthScore, isHealthy, restaurant }: DealCardProps) {
  const discountedPrice = price * (1 - discount / 100);

  return (
    <Link
      href={`/menu-items/${id}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded-2xl"
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        {/* Image */}
        <div className="relative w-full h-40 bg-gray-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">
              🍽️
            </div>
          )}
          {/* Discount badge overlay */}
          <div className="absolute top-2 right-2">
            <Badge color="blue" size="md">
              {discount}% OFF
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-base font-bold text-gray-900 leading-tight flex-1">
              {name}
            </h3>
            <Badge color={isHealthy ? "green" : "orange"} size="sm">
              {isHealthy ? "Healthy" : "Indulgent"}
            </Badge>
          </div>

          <p className="text-xs text-gray-500 mb-3">
            {restaurant.name} • {Math.round(calories)} kcal
          </p>

          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-green-700">
              ₹{discountedPrice.toFixed(0)}
            </span>
            <span className="text-sm text-gray-400 line-through">
              ₹{price.toFixed(0)}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
