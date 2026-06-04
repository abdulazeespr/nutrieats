import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

export interface RestaurantSummary {
  id: string;
  name: string;
  address: string;
  cuisineTags: string[];
  healthScore: number;
  isOpen: boolean;
  menuItems: {
    id: string;
    name: string;
    price: number;
    discount: number;
    imageUrl: string;
  }[];
}

interface RestaurantCardProps {
  restaurant: RestaurantSummary;
  /** Whether any item allergen matches the current user's profile */
  hasAllergenWarning?: boolean;
}

export default function RestaurantCard({
  restaurant,
  hasAllergenWarning = false,
}: RestaurantCardProps) {
  const topDeal = restaurant.menuItems.find((m) => m.discount > 0);
  const isHealthy = restaurant.healthScore >= 6;

  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded-2xl"
    >
      <Card className="p-5 hover:shadow-md transition-shadow relative overflow-hidden">
        {/* Allergen hazard overlay badge */}
        {hasAllergenWarning && (
          <span
            className="absolute top-3 right-3 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1"
            aria-label="Contains your allergens"
          >
            ⚠ Allergen
          </span>
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-gray-900 truncate pr-24">
              {restaurant.name}
            </h3>
            <p className="text-sm text-gray-500 truncate mt-0.5">{restaurant.address}</p>
          </div>

          {/* Health score */}
          <div className="shrink-0 flex flex-col items-center">
            <span
              className={`text-lg font-extrabold ${isHealthy ? "text-green-600" : "text-orange-500"}`}
              aria-label={`Health score ${restaurant.healthScore.toFixed(1)} out of 10`}
            >
              {restaurant.healthScore.toFixed(1)}
            </span>
            <span className="text-xs text-gray-400">/ 10</span>
          </div>
        </div>

        {/* Cuisine tags */}
        {restaurant.cuisineTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3" aria-label="Cuisine types">
            {restaurant.cuisineTags.map((tag) => (
              <Badge key={tag} color="gray" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Classification + deal */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Badge color={isHealthy ? "green" : "orange"} size="sm">
            {isHealthy ? "Healthy" : "Indulgent"}
          </Badge>

          {topDeal && (
            <Badge color="blue" size="sm">
              {topDeal.discount}% off — {topDeal.name}
            </Badge>
          )}
        </div>
      </Card>
    </Link>
  );
}
