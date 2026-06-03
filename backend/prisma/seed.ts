import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { calculateBMR, calculateTDEE, calculateRDA } from "../src/lib/bmr";
import { calculateHealthScore, isHealthy } from "../src/lib/healthScore";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding NutriEats database...");

  const hash = (p: string) => bcrypt.hash(p, 10);

  // ── Merchants ─────────────────────────────────────────────────────────────
  const merchant1 = await prisma.user.upsert({
    where: { email: "owner@greenleaf.com" },
    update: {},
    create: {
      name: "Green Leaf Owner",
      email: "owner@greenleaf.com",
      passwordHash: await hash("password123"),
      role: "MERCHANT",
    },
  });

  const merchant2 = await prisma.user.upsert({
    where: { email: "owner@spicegarden.com" },
    update: {},
    create: {
      name: "Spice Garden Owner",
      email: "owner@spicegarden.com",
      passwordHash: await hash("password123"),
      role: "MERCHANT",
    },
  });

  const merchant3 = await prisma.user.upsert({
    where: { email: "owner@crunchburgers.com" },
    update: {},
    create: {
      name: "Crunch Burgers Owner",
      email: "owner@crunchburgers.com",
      passwordHash: await hash("password123"),
      role: "MERCHANT",
    },
  });

  // ── Restaurants ───────────────────────────────────────────────────────────
  const greenLeaf = await prisma.restaurant.upsert({
    where: { ownerId: merchant1.id },
    update: {},
    create: {
      ownerId: merchant1.id,
      name: "Green Leaf Kitchen",
      address: "12 Wellness Ave, Health District",
      cuisineTags: ["Salads", "Wraps", "Smoothies", "Vegan"],
      isOpen: true,
    },
  });

  const spiceGarden = await prisma.restaurant.upsert({
    where: { ownerId: merchant2.id },
    update: {},
    create: {
      ownerId: merchant2.id,
      name: "Spice Garden",
      address: "45 Masala Street, Curry Quarter",
      cuisineTags: ["Indian", "Curries", "Biryani"],
      isOpen: true,
    },
  });

  const crunchBurgers = await prisma.restaurant.upsert({
    where: { ownerId: merchant3.id },
    update: {},
    create: {
      ownerId: merchant3.id,
      name: "Crunch Burgers",
      address: "7 Fast Lane, Downtown",
      cuisineTags: ["Burgers", "Fries", "Shakes", "American"],
      isOpen: true,
    },
  });

  // ── Menu Items ─────────────────────────────────────────────────────────────
  type ItemDef = {
    name: string; description: string; price: number; imageUrl: string;
    calories: number; protein: number; carbs: number; fat: number; fiber: number;
    cookingMethod: string; ingredients: object[]; allergens: string[]; discount: number;
  };

  const greenLeafItems: ItemDef[] = [
    {
      name: "Quinoa Power Bowl",
      description: "Nutritious quinoa with roasted veggies and tahini dressing",
      price: 280, imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
      calories: 420, protein: 18, carbs: 55, fat: 12, fiber: 8,
      cookingMethod: "Baked and assembled fresh",
      ingredients: [
        { name: "Quinoa", tag: "beneficial" }, { name: "Roasted Broccoli", tag: "beneficial" },
        { name: "Cherry Tomatoes", tag: "beneficial" }, { name: "Tahini", tag: "neutral" },
        { name: "Lemon", tag: "beneficial" },
      ],
      allergens: ["sesame"], discount: 10,
    },
    {
      name: "Grilled Chicken Wrap",
      description: "Lean grilled chicken with fresh veggies in a whole wheat wrap",
      price: 220, imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400",
      calories: 380, protein: 32, carbs: 35, fat: 9, fiber: 5,
      cookingMethod: "Grilled on cast iron, no added oil",
      ingredients: [
        { name: "Chicken Breast", tag: "beneficial" }, { name: "Whole Wheat Wrap", tag: "neutral" },
        { name: "Lettuce", tag: "beneficial" }, { name: "Tomato", tag: "beneficial" },
        { name: "Low-fat Yogurt Sauce", tag: "neutral" },
      ],
      allergens: ["gluten", "dairy"], discount: 15,
    },
    {
      name: "Green Detox Smoothie",
      description: "Spinach, cucumber, apple, ginger blend",
      price: 160, imageUrl: "https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400",
      calories: 180, protein: 4, carbs: 38, fat: 1, fiber: 6,
      cookingMethod: "Cold blended, no heat",
      ingredients: [
        { name: "Spinach", tag: "beneficial" }, { name: "Cucumber", tag: "beneficial" },
        { name: "Apple", tag: "beneficial" }, { name: "Ginger", tag: "beneficial" },
      ],
      allergens: [], discount: 20,
    },
    {
      name: "Avocado Toast",
      description: "Multigrain toast topped with smashed avocado and seeds",
      price: 190, imageUrl: "https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=400",
      calories: 310, protein: 8, carbs: 28, fat: 18, fiber: 9,
      cookingMethod: "Toasted, no frying",
      ingredients: [
        { name: "Multigrain Bread", tag: "neutral" }, { name: "Avocado", tag: "beneficial" },
        { name: "Chia Seeds", tag: "beneficial" }, { name: "Lemon Juice", tag: "beneficial" },
      ],
      allergens: ["gluten"], discount: 0,
    },
    {
      name: "Lentil Soup",
      description: "Hearty red lentil soup with turmeric and cumin",
      price: 150, imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400",
      calories: 250, protein: 14, carbs: 40, fat: 3, fiber: 10,
      cookingMethod: "Slow simmered, no added fat",
      ingredients: [
        { name: "Red Lentils", tag: "beneficial" }, { name: "Turmeric", tag: "beneficial" },
        { name: "Cumin", tag: "beneficial" }, { name: "Tomatoes", tag: "beneficial" },
      ],
      allergens: [], discount: 5,
    },
  ];

  const spiceGardenItems: ItemDef[] = [
    {
      name: "Chicken Biryani",
      description: "Aromatic basmati rice with tender chicken and whole spices",
      price: 320, imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400",
      calories: 680, protein: 28, carbs: 85, fat: 22, fiber: 3,
      cookingMethod: "Slow dum cooking with ghee",
      ingredients: [
        { name: "Basmati Rice", tag: "neutral" }, { name: "Chicken", tag: "beneficial" },
        { name: "Ghee", tag: "watch-out" }, { name: "Whole Spices", tag: "beneficial" },
        { name: "Saffron", tag: "beneficial" },
      ],
      allergens: ["dairy"], discount: 10,
    },
    {
      name: "Palak Paneer",
      description: "Cottage cheese in creamy spinach gravy",
      price: 260, imageUrl: "https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400",
      calories: 390, protein: 18, carbs: 20, fat: 25, fiber: 5,
      cookingMethod: "Sautéed and simmered",
      ingredients: [
        { name: "Spinach", tag: "beneficial" }, { name: "Paneer", tag: "neutral" },
        { name: "Cream", tag: "watch-out" }, { name: "Onion", tag: "beneficial" },
      ],
      allergens: ["dairy"], discount: 0,
    },
    {
      name: "Dal Tadka",
      description: "Yellow lentils tempered with aromatic spices",
      price: 180, imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400",
      calories: 280, protein: 16, carbs: 42, fat: 7, fiber: 11,
      cookingMethod: "Pressure cooked, light tempering",
      ingredients: [
        { name: "Yellow Lentils", tag: "beneficial" }, { name: "Garlic", tag: "beneficial" },
        { name: "Cumin Seeds", tag: "beneficial" }, { name: "Butter", tag: "watch-out" },
      ],
      allergens: ["dairy"], discount: 15,
    },
    {
      name: "Tandoori Roti",
      description: "Whole wheat bread from clay tandoor",
      price: 40, imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400",
      calories: 120, protein: 4, carbs: 24, fat: 1, fiber: 3,
      cookingMethod: "Baked in tandoor oven, no oil",
      ingredients: [
        { name: "Whole Wheat Flour", tag: "neutral" }, { name: "Water", tag: "beneficial" },
      ],
      allergens: ["gluten"], discount: 0,
    },
    {
      name: "Mango Lassi",
      description: "Chilled yogurt drink with fresh mango",
      price: 100, imageUrl: "https://images.unsplash.com/photo-1571006682372-d9cb9af31f83?w=400",
      calories: 220, protein: 6, carbs: 38, fat: 5, fiber: 1,
      cookingMethod: "Blended chilled",
      ingredients: [
        { name: "Mango Pulp", tag: "beneficial" }, { name: "Yogurt", tag: "neutral" },
        { name: "Sugar", tag: "watch-out" },
      ],
      allergens: ["dairy"], discount: 20,
    },
  ];

  const crunchBurgersItems: ItemDef[] = [
    {
      name: "Classic Smash Burger",
      description: "Double smashed beef patty with cheese, pickles, special sauce",
      price: 350, imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
      calories: 780, protein: 35, carbs: 55, fat: 48, fiber: 2,
      cookingMethod: "Deep fried patty, smashed on flat top",
      ingredients: [
        { name: "Beef Patty", tag: "neutral" }, { name: "Cheddar Cheese", tag: "watch-out" },
        { name: "Brioche Bun", tag: "watch-out" }, { name: "Pickles", tag: "neutral" },
        { name: "Special Sauce (mayo base)", tag: "watch-out" },
      ],
      allergens: ["gluten", "dairy", "eggs"], discount: 20,
    },
    {
      name: "Loaded Cheese Fries",
      description: "Crispy fries smothered in cheese sauce and jalapenos",
      price: 220, imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400",
      calories: 620, protein: 12, carbs: 72, fat: 32, fiber: 4,
      cookingMethod: "Deep fried in vegetable oil",
      ingredients: [
        { name: "Potato", tag: "neutral" }, { name: "Cheese Sauce", tag: "watch-out" },
        { name: "Jalapenos", tag: "neutral" }, { name: "Refined Oil", tag: "watch-out" },
      ],
      allergens: ["dairy", "gluten"], discount: 15,
    },
    {
      name: "Crispy Chicken Burger",
      description: "Southern-fried chicken fillet with coleslaw",
      price: 300, imageUrl: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400",
      calories: 710, protein: 30, carbs: 60, fat: 38, fiber: 2,
      cookingMethod: "Deep fried in refined oil",
      ingredients: [
        { name: "Chicken Thigh", tag: "neutral" }, { name: "Buttermilk Batter", tag: "watch-out" },
        { name: "Coleslaw", tag: "neutral" }, { name: "Brioche Bun", tag: "watch-out" },
      ],
      allergens: ["gluten", "dairy", "eggs"], discount: 10,
    },
    {
      name: "Chocolate Milkshake",
      description: "Thick creamy chocolate shake with whipped cream",
      price: 180, imageUrl: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400",
      calories: 520, protein: 10, carbs: 68, fat: 24, fiber: 1,
      cookingMethod: "Blended, no heat",
      ingredients: [
        { name: "Full-fat Ice Cream", tag: "watch-out" }, { name: "Chocolate Syrup", tag: "watch-out" },
        { name: "Whole Milk", tag: "neutral" }, { name: "Whipped Cream", tag: "watch-out" },
      ],
      allergens: ["dairy", "eggs"], discount: 25,
    },
    {
      name: "Veggie Wrap",
      description: "Grilled veggies in a tortilla with hummus",
      price: 220, imageUrl: "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=400",
      calories: 340, protein: 10, carbs: 48, fat: 12, fiber: 7,
      cookingMethod: "Grilled veggies, assembled fresh",
      ingredients: [
        { name: "Whole Wheat Tortilla", tag: "neutral" }, { name: "Zucchini", tag: "beneficial" },
        { name: "Bell Peppers", tag: "beneficial" }, { name: "Hummus", tag: "beneficial" },
      ],
      allergens: ["gluten", "sesame"], discount: 5,
    },
  ];

  async function seedItems(restaurantId: string, items: ItemDef[]) {
    for (const item of items) {
      const healthScore = calculateHealthScore(item);
      await prisma.menuItem.upsert({
        where: { id: `seed-${restaurantId}-${item.name.replace(/\s+/g, "-").toLowerCase()}` },
        update: {},
        create: {
          id: `seed-${restaurantId}-${item.name.replace(/\s+/g, "-").toLowerCase()}`,
          restaurantId,
          ...item,
          ingredients: item.ingredients,
          healthScore,
          isHealthy: isHealthy(healthScore),
        },
      });
    }

    const avg = await prisma.menuItem.aggregate({
      where: { restaurantId },
      _avg: { healthScore: true },
    });
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { healthScore: avg._avg.healthScore ?? 5 },
    });
  }

  await seedItems(greenLeaf.id, greenLeafItems);
  await seedItems(spiceGarden.id, spiceGardenItems);
  await seedItems(crunchBurgers.id, crunchBurgersItems);

  // ── Customers ──────────────────────────────────────────────────────────────
  const customers = [
    {
      name: "Arjun Sharma",
      email: "arjun@example.com",
      age: 28, weightKg: 75, heightCm: 178, gender: "MALE" as const,
      activityLevel: "MODERATELY_ACTIVE" as const,
      allergens: [],
    },
    {
      name: "Priya Nair",
      email: "priya@example.com",
      age: 24, weightKg: 58, heightCm: 163, gender: "FEMALE" as const,
      activityLevel: "LIGHTLY_ACTIVE" as const,
      allergens: ["gluten", "nuts"],
    },
    {
      name: "Rahul Mehta",
      email: "rahul@example.com",
      age: 35, weightKg: 90, heightCm: 180, gender: "MALE" as const,
      activityLevel: "SEDENTARY" as const,
      allergens: ["dairy"],
    },
  ];

  for (const c of customers) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        name: c.name,
        email: c.email,
        passwordHash: await hash("password123"),
        role: "CUSTOMER",
      },
    });

    const bmr = calculateBMR(c.weightKg, c.heightCm, c.age, c.gender);
    const tdee = calculateTDEE(bmr, c.activityLevel);
    const rda = calculateRDA(c.weightKg, tdee);

    await prisma.bodyStats.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        age: c.age, weightKg: c.weightKg, heightCm: c.heightCm,
        gender: c.gender, activityLevel: c.activityLevel,
        bmr, ...rda,
      },
    });

    await prisma.notifPrefs.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    if (c.allergens.length > 0) {
      for (const allergenName of c.allergens) {
        await prisma.allergy.upsert({
          where: { userId_allergenName: { userId: user.id, allergenName } },
          update: {},
          create: { userId: user.id, allergenName },
        });
      }
    }
  }

  // ── Riders ─────────────────────────────────────────────────────────────────
  const riders = ["Ravi Kumar", "Sanjay Patel", "Dev Singh"];
  for (const name of riders) {
    const email = `${name.toLowerCase().replace(/\s/g, ".")}@rider.com`;
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name, email,
        passwordHash: await hash("password123"),
        role: "RIDER",
        phone: "+91 9876543210",
      },
    });
  }

  console.log("✅ Seed complete!");
  console.log("\nTest accounts (all passwords: password123):");
  console.log("  Customers: arjun@example.com, priya@example.com, rahul@example.com");
  console.log("  Merchants: owner@greenleaf.com, owner@spicegarden.com, owner@crunchburgers.com");
  console.log("  Riders:    ravi.kumar@rider.com, sanjay.patel@rider.com, dev.singh@rider.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
