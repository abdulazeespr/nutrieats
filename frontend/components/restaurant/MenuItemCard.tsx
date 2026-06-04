import Link from "next/link";
import Image from "next/image";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

export interface MenuItemSummary {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  calories: number;
  healthScore: number;
  isHealthy: boolean;
  allergens: string[];
  discount: number;
}

interface MenuItemCardProps {
  item: MenuItemSummary;
  userAllergens?: string[];
}

export default function MenuItemCard({ item, userAllergens = [] }: MenuItemCardProps) {
  const hasAllergenWarning =
    userAllergens.length > 0 &&
    item.allergens.some((a) =>
      userAllergens.some((ua) => ua.toLowerCase() === a.toLowerCase())
    );

  const discountedPrice =
    item.discount > 0 ? item.price * (1 - item.discount / 100) : null;

  return (
    <Link
      href={`/menu-items/${item.id}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded-2xl"
    >
      <Card className="flex gap-4 p-4 hover:shadow-md transition-shadow relative overflow-hidden">
        {/* Item image */}
        {item.imageUrl ? (
          <div className="shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
            <Image
              src={item.imageUrl}
              alt={item.name}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div
            className="shrink-0 w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-3xl"
            aria-hidden="true"
          >
            🍽️
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-bold text-gray-900 leading-snug">
              {item.name}
            </h4>
            {hasAllergenWarning && (
              <span
                className="shrink-0 text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full"
                aria-label="Contains your allergens"
              >
                ⚠ Allergen
              </span>
            )}
          </div>

          {item.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
              {item.description}
            </p>
          )}

          {/* Badges row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge color={item.isHealthy ? "green" : "orange"} size="sm">
              {item.isHealthy ? "Healthy" : "Indulgent"}
            </Badge>
            <span className="text-xs text-gray-500">{Math.round(item.calories)} kcal</span>
          </div>

          {/* Price row */}
          <div className="flex items-center gap-2 mt-2">
            {discountedPrice != null ? (
              <>
                <span className="text-sm font-bold text-green-700">
                  ₹{discountedPrice.toFixed(0)}
                </span>
                <span className="text-xs text-gray-400 line-through">
                  ₹{item.price.toFixed(0)}
                </span>
                <Badge color="blue" size="sm">{item.discount}% off</Badge>
              </>
            ) : (
              <span className="text-sm font-bold text-gray-800">
                ₹{item.price.toFixed(0)}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
