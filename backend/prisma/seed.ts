import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { calculateBMR, calculateTDEE, calculateRDA } from "../src/lib/bmr";
import { calculateHealthScore, isHealthy } from "../src/lib/healthScore";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding NutriEats database…");

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
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    cookingMethod: string;
    ingredients: object[];
    allergens: string[];
    discount: number;
    flashDealUntil?: Date | null;
  };

  // ── Green Leaf Kitchen (10 items — high health scores) ────────────────────
  const greenLeafItems: ItemDef[] = [
    {
      name: "Quinoa Power Bowl",
      description: "Nutritious quinoa with roasted veggies and tahini dressing",
      price: 280,
      imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
      calories: 420, protein: 18, carbs: 55, fat: 12, fiber: 8,
      cookingMethod: "Baked and assembled fresh",
      ingredients: [
        { name: "Quinoa", tag: "beneficial" },
        { name: "Roasted Broccoli", tag: "beneficial" },
        { name: "Cherry Tomatoes", tag: "beneficial" },
        { name: "Tahini", tag: "neutral" },
        { name: "Lemon", tag: "beneficial" },
      ],
      allergens: ["sesame"],
      discount: 10,
    },
    {
      name: "Grilled Chicken Wrap",
      description: "Lean grilled chicken with fresh veggies in a whole wheat wrap",
      price: 220,
      imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400",
      calories: 380, protein: 32, carbs: 35, fat: 9, fiber: 5,
      cookingMethod: "Grilled on cast iron, no added oil",
      ingredients: [
        { name: "Chicken Breast", tag: "beneficial" },
        { name: "Whole Wheat Wrap", tag: "neutral" },
        { name: "Lettuce", tag: "beneficial" },
        { name: "Tomato", tag: "beneficial" },
        { name: "Low-fat Yogurt Sauce", tag: "neutral" },
      ],
      allergens: ["gluten", "dairy"],
      discount: 15,
    },
    {
      name: "Green Detox Smoothie",
      description: "Spinach, cucumber, apple, ginger blend",
      price: 160,
      imageUrl: "https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400",
      calories: 180, protein: 4, carbs: 38, fat: 1, fiber: 6,
      cookingMethod: "Cold blended, no heat",
      ingredients: [
        { name: "Spinach", tag: "beneficial" },
        { name: "Cucumber", tag: "beneficial" },
        { name: "Apple", tag: "beneficial" },
        { name: "Ginger", tag: "beneficial" },
      ],
      allergens: [],
      discount: 20,
    },
    {
      name: "Avocado Toast",
      description: "Multigrain toast topped with smashed avocado and seeds",
      price: 190,
      imageUrl: "https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=400",
      calories: 310, protein: 8, carbs: 28, fat: 18, fiber: 9,
      cookingMethod: "Toasted, no frying",
      ingredients: [
        { name: "Multigrain Bread", tag: "neutral" },
        { name: "Avocado", tag: "beneficial" },
        { name: "Chia Seeds", tag: "beneficial" },
        { name: "Lemon Juice", tag: "beneficial" },
      ],
      allergens: ["gluten"],
      discount: 0,
    },
    {
      name: "Lentil Soup",
      description: "Hearty red lentil soup with turmeric and cumin",
      price: 150,
      imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400",
      calories: 250, protein: 14, carbs: 40, fat: 3, fiber: 10,
      cookingMethod: "Slow simmered, no added fat",
      ingredients: [
        { name: "Red Lentils", tag: "beneficial" },
        { name: "Turmeric", tag: "beneficial" },
        { name: "Cumin", tag: "beneficial" },
        { name: "Tomatoes", tag: "beneficial" },
      ],
      allergens: [],
      discount: 5,
    },
    {
      name: "Beetroot & Walnut Salad",
      description: "Roasted beetroot with walnuts, feta, and balsamic glaze",
      price: 240,
      imageUrl: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=400",
      calories: 290, protein: 10, carbs: 28, fat: 15, fiber: 7,
      cookingMethod: "Roasted and assembled cold",
      ingredients: [
        { name: "Beetroot", tag: "beneficial" },
        { name: "Walnuts", tag: "beneficial" },
        { name: "Feta Cheese", tag: "neutral" },
        { name: "Balsamic Vinegar", tag: "neutral" },
      ],
      allergens: ["dairy", "nuts"],
      discount: 0,
    },
    {
      name: "Mango Chia Pudding",
      description: "Overnight chia seeds with coconut milk and fresh mango",
      price: 170,
      imageUrl: "https://images.unsplash.com/photo-1548369937-47519962c11a?w=400",
      calories: 260, protein: 7, carbs: 36, fat: 9, fiber: 11,
      cookingMethod: "No cook — soaked overnight",
      ingredients: [
        { name: "Chia Seeds", tag: "beneficial" },
        { name: "Coconut Milk", tag: "neutral" },
        { name: "Fresh Mango", tag: "beneficial" },
        { name: "Honey", tag: "neutral" },
      ],
      allergens: [],
      discount: 10,
    },
    {
      name: "Tofu Stir-Fry Bowl",
      description: "Pan-tossed tofu with bell peppers, broccoli, and ginger soy sauce",
      price: 260,
      imageUrl: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=400",
      calories: 350, protein: 22, carbs: 30, fat: 10, fiber: 8,
      cookingMethod: "Stir-fried in minimal sesame oil",
      ingredients: [
        { name: "Tofu", tag: "beneficial" },
        { name: "Bell Peppers", tag: "beneficial" },
        { name: "Broccoli", tag: "beneficial" },
        { name: "Low-sodium Soy Sauce", tag: "neutral" },
        { name: "Sesame Oil", tag: "neutral" },
      ],
      allergens: ["soy", "sesame"],
      discount: 0,
    },
    {
      name: "Berry Protein Smoothie",
      description: "Mixed berries, banana, whey protein, and almond milk",
      price: 200,
      imageUrl: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400",
      calories: 300, protein: 25, carbs: 42, fat: 4, fiber: 5,
      cookingMethod: "Cold blended",
      ingredients: [
        { name: "Mixed Berries", tag: "beneficial" },
        { name: "Banana", tag: "beneficial" },
        { name: "Whey Protein", tag: "beneficial" },
        { name: "Almond Milk", tag: "neutral" },
      ],
      allergens: ["dairy", "nuts"],
      discount: 15,
    },
    {
      name: "Hummus & Veggie Platter",
      description: "Classic hummus with cucumber, carrot sticks, and pita",
      price: 180,
      imageUrl: "https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400",
      calories: 320, protein: 11, carbs: 38, fat: 13, fiber: 8,
      cookingMethod: "Blended, served chilled",
      ingredients: [
        { name: "Chickpeas", tag: "beneficial" },
        { name: "Tahini", tag: "neutral" },
        { name: "Cucumber", tag: "beneficial" },
        { name: "Carrot", tag: "beneficial" },
        { name: "Whole Wheat Pita", tag: "neutral" },
      ],
      allergens: ["gluten", "sesame"],
      discount: 5,
    },
  ];

  // ── Spice Garden (10 items — mixed health scores) ─────────────────────────
  const spiceGardenItems: ItemDef[] = [
    {
      name: "Chicken Biryani",
      description: "Aromatic basmati rice with tender chicken and whole spices",
      price: 320,
      imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400",
      calories: 680, protein: 28, carbs: 85, fat: 22, fiber: 3,
      cookingMethod: "Slow dum cooking with ghee",
      ingredients: [
        { name: "Basmati Rice", tag: "neutral" },
        { name: "Chicken", tag: "beneficial" },
        { name: "Ghee", tag: "watch-out" },
        { name: "Whole Spices", tag: "beneficial" },
        { name: "Saffron", tag: "beneficial" },
      ],
      allergens: ["dairy"],
      discount: 10,
    },
    {
      name: "Palak Paneer",
      description: "Cottage cheese in creamy spinach gravy",
      price: 260,
      imageUrl: "https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400",
      calories: 390, protein: 18, carbs: 20, fat: 25, fiber: 5,
      cookingMethod: "Sautéed and simmered",
      ingredients: [
        { name: "Spinach", tag: "beneficial" },
        { name: "Paneer", tag: "neutral" },
        { name: "Cream", tag: "watch-out" },
        { name: "Onion", tag: "beneficial" },
      ],
      allergens: ["dairy"],
      discount: 0,
    },
    {
      name: "Dal Tadka",
      description: "Yellow lentils tempered with aromatic spices",
      price: 180,
      imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400",
      calories: 280, protein: 16, carbs: 42, fat: 7, fiber: 11,
      cookingMethod: "Pressure cooked, light tempering",
      ingredients: [
        { name: "Yellow Lentils", tag: "beneficial" },
        { name: "Garlic", tag: "beneficial" },
        { name: "Cumin Seeds", tag: "beneficial" },
        { name: "Butter", tag: "watch-out" },
      ],
      allergens: ["dairy"],
      discount: 15,
    },
    {
      name: "Tandoori Roti",
      description: "Whole wheat bread from clay tandoor",
      price: 40,
      imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400",
      calories: 120, protein: 4, carbs: 24, fat: 1, fiber: 3,
      cookingMethod: "Baked in tandoor oven, no oil",
      ingredients: [
        { name: "Whole Wheat Flour", tag: "neutral" },
        { name: "Water", tag: "beneficial" },
      ],
      allergens: ["gluten"],
      discount: 0,
    },
    {
      name: "Mango Lassi",
      description: "Chilled yogurt drink with fresh mango",
      price: 100,
      imageUrl: "https://images.unsplash.com/photo-1571006682372-d9cb9af31f83?w=400",
      calories: 220, protein: 6, carbs: 38, fat: 5, fiber: 1,
      cookingMethod: "Blended chilled",
      ingredients: [
        { name: "Mango Pulp", tag: "beneficial" },
        { name: "Yogurt", tag: "neutral" },
        { name: "Sugar", tag: "watch-out" },
      ],
      allergens: ["dairy"],
      discount: 20,
    },
    {
      name: "Chana Masala",
      description: "Spiced chickpeas slow-cooked in tangy tomato gravy",
      price: 200,
      imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400",
      calories: 310, protein: 14, carbs: 48, fat: 7, fiber: 12,
      cookingMethod: "Pressure cooked, tempering with minimal oil",
      ingredients: [
        { name: "Chickpeas", tag: "beneficial" },
        { name: "Tomatoes", tag: "beneficial" },
        { name: "Onion", tag: "beneficial" },
        { name: "Cumin", tag: "beneficial" },
        { name: "Vegetable Oil", tag: "neutral" },
      ],
      allergens: [],
      discount: 0,
    },
    {
      name: "Mutton Rogan Josh",
      description: "Tender mutton in rich Kashmiri spiced gravy",
      price: 380,
      imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400",
      calories: 520, protein: 32, carbs: 14, fat: 34, fiber: 2,
      cookingMethod: "Slow braised with whole spices and ghee",
      ingredients: [
        { name: "Mutton", tag: "neutral" },
        { name: "Ghee", tag: "watch-out" },
        { name: "Yogurt", tag: "neutral" },
        { name: "Kashmiri Chilli", tag: "beneficial" },
      ],
      allergens: ["dairy"],
      discount: 5,
    },
    {
      name: "Vegetable Korma",
      description: "Mixed vegetables in mild coconut and cashew cream sauce",
      price: 240,
      imageUrl: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400",
      calories: 360, protein: 9, carbs: 32, fat: 22, fiber: 6,
      cookingMethod: "Simmered in coconut cream",
      ingredients: [
        { name: "Mixed Vegetables", tag: "beneficial" },
        { name: "Coconut Cream", tag: "watch-out" },
        { name: "Cashews", tag: "neutral" },
        { name: "Cardamom", tag: "beneficial" },
      ],
      allergens: ["nuts"],
      discount: 10,
    },
    {
      name: "Jeera Rice",
      description: "Fragrant cumin-tempered basmati rice",
      price: 120,
      imageUrl: "https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=400",
      calories: 240, protein: 5, carbs: 50, fat: 4, fiber: 1,
      cookingMethod: "Steamed and lightly tempered",
      ingredients: [
        { name: "Basmati Rice", tag: "neutral" },
        { name: "Cumin Seeds", tag: "beneficial" },
        { name: "Ghee", tag: "watch-out" },
      ],
      allergens: ["dairy"],
      discount: 0,
    },
    {
      name: "Raita",
      description: "Cooling yogurt with cucumber, mint, and roasted cumin",
      price: 80,
      imageUrl: "https://images.unsplash.com/photo-1627662235386-b064aa3c72a0?w=400",
      calories: 110, protein: 5, carbs: 12, fat: 4, fiber: 1,
      cookingMethod: "No cook — assembled and chilled",
      ingredients: [
        { name: "Yogurt", tag: "beneficial" },
        { name: "Cucumber", tag: "beneficial" },
        { name: "Mint", tag: "beneficial" },
        { name: "Roasted Cumin", tag: "beneficial" },
      ],
      allergens: ["dairy"],
      discount: 0,
    },
  ];

  // ── Crunch Burgers (10 items — low health scores) ─────────────────────────
  const crunchBurgersItems: ItemDef[] = [
    {
      name: "Classic Smash Burger",
      description: "Double smashed beef patty with cheese, pickles, special sauce",
      price: 350,
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
      calories: 780, protein: 35, carbs: 55, fat: 48, fiber: 2,
      cookingMethod: "Deep fried patty, smashed on flat top",
      ingredients: [
        { name: "Beef Patty", tag: "neutral" },
        { name: "Cheddar Cheese", tag: "watch-out" },
        { name: "Brioche Bun", tag: "watch-out" },
        { name: "Pickles", tag: "neutral" },
        { name: "Special Sauce (mayo base)", tag: "watch-out" },
      ],
      allergens: ["gluten", "dairy", "eggs"],
      discount: 20,
    },
    {
      name: "Loaded Cheese Fries",
      description: "Crispy fries smothered in cheese sauce and jalapeños",
      price: 220,
      imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400",
      calories: 620, protein: 12, carbs: 72, fat: 32, fiber: 4,
      cookingMethod: "Deep fried in vegetable oil",
      ingredients: [
        { name: "Potato", tag: "neutral" },
        { name: "Cheese Sauce", tag: "watch-out" },
        { name: "Jalapeños", tag: "neutral" },
        { name: "Refined Oil", tag: "watch-out" },
      ],
      allergens: ["dairy", "gluten"],
      discount: 15,
    },
    {
      name: "Crispy Chicken Burger",
      description: "Southern-fried chicken fillet with coleslaw",
      price: 300,
      imageUrl: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400",
      calories: 710, protein: 30, carbs: 60, fat: 38, fiber: 2,
      cookingMethod: "Deep fried in refined oil",
      ingredients: [
        { name: "Chicken Thigh", tag: "neutral" },
        { name: "Buttermilk Batter", tag: "watch-out" },
        { name: "Coleslaw", tag: "neutral" },
        { name: "Brioche Bun", tag: "watch-out" },
      ],
      allergens: ["gluten", "dairy", "eggs"],
      discount: 10,
    },
    {
      name: "Chocolate Milkshake",
      description: "Thick creamy chocolate shake with whipped cream",
      price: 180,
      imageUrl: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400",
      calories: 520, protein: 10, carbs: 68, fat: 24, fiber: 1,
      cookingMethod: "Blended, no heat",
      ingredients: [
        { name: "Full-fat Ice Cream", tag: "watch-out" },
        { name: "Chocolate Syrup", tag: "watch-out" },
        { name: "Whole Milk", tag: "neutral" },
        { name: "Whipped Cream", tag: "watch-out" },
      ],
      allergens: ["dairy", "eggs"],
      discount: 25,
    },
    {
      name: "Veggie Wrap",
      description: "Grilled veggies in a tortilla with hummus",
      price: 220,
      imageUrl: "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=400",
      calories: 340, protein: 10, carbs: 48, fat: 12, fiber: 7,
      cookingMethod: "Grilled veggies, assembled fresh",
      ingredients: [
        { name: "Whole Wheat Tortilla", tag: "neutral" },
        { name: "Zucchini", tag: "beneficial" },
        { name: "Bell Peppers", tag: "beneficial" },
        { name: "Hummus", tag: "beneficial" },
      ],
      allergens: ["gluten", "sesame"],
      discount: 5,
    },
    {
      name: "BBQ Bacon Burger",
      description: "Beef patty with crispy bacon, BBQ sauce, and onion rings",
      price: 390,
      imageUrl: "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=400",
      calories: 860, protein: 38, carbs: 60, fat: 52, fiber: 2,
      cookingMethod: "Deep fried patty and bacon",
      ingredients: [
        { name: "Beef Patty", tag: "neutral" },
        { name: "Bacon", tag: "watch-out" },
        { name: "BBQ Sauce", tag: "watch-out" },
        { name: "Onion Rings", tag: "watch-out" },
        { name: "Brioche Bun", tag: "watch-out" },
      ],
      allergens: ["gluten", "dairy", "eggs"],
      discount: 20,
    },
    {
      name: "Spicy Jalapeño Poppers",
      description: "Cream cheese stuffed jalapeños, beer-battered and fried",
      price: 200,
      imageUrl: "https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=400",
      calories: 480, protein: 9, carbs: 42, fat: 30, fiber: 2,
      cookingMethod: "Deep fried in refined oil",
      ingredients: [
        { name: "Jalapeños", tag: "neutral" },
        { name: "Cream Cheese", tag: "watch-out" },
        { name: "Beer Batter", tag: "watch-out" },
        { name: "Refined Oil", tag: "watch-out" },
      ],
      allergens: ["gluten", "dairy", "eggs"],
      discount: 0,
    },
    {
      name: "Onion Rings",
      description: "Crispy beer-battered onion rings with dipping sauce",
      price: 160,
      imageUrl: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=400",
      calories: 420, protein: 6, carbs: 54, fat: 20, fiber: 3,
      cookingMethod: "Deep fried in vegetable oil",
      ingredients: [
        { name: "Onion", tag: "beneficial" },
        { name: "Beer Batter", tag: "watch-out" },
        { name: "Refined Oil", tag: "watch-out" },
        { name: "Ranch Dip", tag: "watch-out" },
      ],
      allergens: ["gluten", "dairy", "eggs"],
      discount: 0,
    },
    {
      name: "Double Patty Melt",
      description: "Two beef patties with caramelised onion and Swiss cheese on rye",
      price: 420,
      imageUrl: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400",
      calories: 820, protein: 42, carbs: 52, fat: 46, fiber: 2,
      cookingMethod: "Pan-fried with butter",
      ingredients: [
        { name: "Beef Patty", tag: "neutral" },
        { name: "Swiss Cheese", tag: "watch-out" },
        { name: "Caramelised Onion", tag: "neutral" },
        { name: "Rye Bread", tag: "neutral" },
        { name: "Butter", tag: "watch-out" },
      ],
      allergens: ["gluten", "dairy", "eggs"],
      discount: 15,
    },
    {
      name: "Strawberry Soft Serve",
      description: "Light strawberry-flavoured soft serve cone",
      price: 120,
      imageUrl: "https://images.unsplash.com/photo-1560008581-09826d1de69e?w=400",
      calories: 290, protein: 5, carbs: 46, fat: 10, fiber: 0,
      cookingMethod: "Machine-churned, served immediately",
      ingredients: [
        { name: "Soft Serve Mix", tag: "watch-out" },
        { name: "Strawberry Syrup", tag: "watch-out" },
        { name: "Whole Milk", tag: "neutral" },
      ],
      allergens: ["dairy", "eggs"],
      discount: 0,
    },
  ];

  async function seedItems(restaurantId: string, items: ItemDef[]) {
    const flashUntil = new Date(Date.now() + 6 * 60 * 60 * 1000);

    for (const item of items) {
      const healthScore = calculateHealthScore(item);
      const isFlash = item.discount >= 20;
      await prisma.menuItem.upsert({
        where: {
          id: `seed-${restaurantId}-${item.name.replace(/\s+/g, "-").toLowerCase()}`,
        },
        update: { flashDealUntil: isFlash ? flashUntil : null },
        create: {
          id: `seed-${restaurantId}-${item.name.replace(/\s+/g, "-").toLowerCase()}`,
          restaurantId,
          ...item,
          ingredients: item.ingredients,
          healthScore,
          isHealthy: isHealthy(healthScore),
          flashDealUntil: isFlash ? flashUntil : null,
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

  // ── Customers (5 total) ────────────────────────────────────────────────────
  const customerDefs = [
    {
      name: "Arjun Sharma",
      email: "arjun@example.com",
      age: 28, weightKg: 75, heightCm: 178,
      gender: "MALE" as const,
      activityLevel: "MODERATELY_ACTIVE" as const,
      allergens: [] as string[],
    },
    {
      name: "Priya Nair",
      email: "priya@example.com",
      age: 24, weightKg: 58, heightCm: 163,
      gender: "FEMALE" as const,
      activityLevel: "LIGHTLY_ACTIVE" as const,
      allergens: ["gluten", "nuts"],
    },
    {
      name: "Rahul Mehta",
      email: "rahul@example.com",
      age: 35, weightKg: 90, heightCm: 180,
      gender: "MALE" as const,
      activityLevel: "SEDENTARY" as const,
      allergens: ["dairy"],
    },
    {
      name: "Sneha Reddy",
      email: "sneha@example.com",
      age: 30, weightKg: 62, heightCm: 165,
      gender: "FEMALE" as const,
      activityLevel: "VERY_ACTIVE" as const,
      allergens: ["eggs"],
    },
    {
      name: "Karan Verma",
      email: "karan@example.com",
      age: 22, weightKg: 70, heightCm: 175,
      gender: "MALE" as const,
      activityLevel: "LIGHTLY_ACTIVE" as const,
      allergens: [] as string[],
    },
  ];

  const customerUsers: { id: string; weightKg: number }[] = [];

  for (const c of customerDefs) {
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
        age: c.age,
        weightKg: c.weightKg,
        heightCm: c.heightCm,
        gender: c.gender,
        activityLevel: c.activityLevel,
        bmr,
        ...rda,
      },
    });

    await prisma.notifPrefs.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    for (const allergenName of c.allergens) {
      await prisma.allergy.upsert({
        where: { userId_allergenName: { userId: user.id, allergenName } },
        update: {},
        create: { userId: user.id, allergenName },
      });
    }

    customerUsers.push({ id: user.id, weightKg: c.weightKg });
  }

  // ── Riders ─────────────────────────────────────────────────────────────────
  const riders = ["Ravi Kumar", "Sanjay Patel", "Dev Singh"];
  const riderUsers: string[] = [];

  for (const name of riders) {
    const email = `${name.toLowerCase().replace(/\s/g, ".")}@rider.com`;
    const rider = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name,
        email,
        passwordHash: await hash("password123"),
        role: "RIDER",
        phone: "+91 9876543210",
      },
    });
    riderUsers.push(rider.id);
  }

  // ── Sample Orders ──────────────────────────────────────────────────────────
  // Fetch all seeded menu items for use in orders
  const glItems = await prisma.menuItem.findMany({ where: { restaurantId: greenLeaf.id } });
  const sgItems = await prisma.menuItem.findMany({ where: { restaurantId: spiceGarden.id } });
  const cbItems = await prisma.menuItem.findMany({ where: { restaurantId: crunchBurgers.id } });

  type SeedOrder = {
    customerId: string;
    restaurantId: string;
    status: "PLACED" | "CONFIRMED" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED";
    deliveryAddress: string;
    items: { item: { id: string; price: number; calories: number }; qty: number }[];
    riderId?: string;
    daysAgo: number;
  };

  const seedOrders: SeedOrder[] = [
    // Arjun — delivered Green Leaf order
    {
      customerId: customerUsers[0].id,
      restaurantId: greenLeaf.id,
      status: "DELIVERED",
      deliveryAddress: "22 Green Park Colony, Bangalore",
      items: [
        { item: glItems.find((i) => i.name === "Quinoa Power Bowl")!, qty: 1 },
        { item: glItems.find((i) => i.name === "Green Detox Smoothie")!, qty: 1 },
      ],
      riderId: riderUsers[0],
      daysAgo: 3,
    },
    // Arjun — active Spice Garden order
    {
      customerId: customerUsers[0].id,
      restaurantId: spiceGarden.id,
      status: "PREPARING",
      deliveryAddress: "22 Green Park Colony, Bangalore",
      items: [
        { item: sgItems.find((i) => i.name === "Chicken Biryani")!, qty: 1 },
        { item: sgItems.find((i) => i.name === "Raita")!, qty: 1 },
      ],
      daysAgo: 0,
    },
    // Priya — delivered Crunch Burgers order
    {
      customerId: customerUsers[1].id,
      restaurantId: crunchBurgers.id,
      status: "DELIVERED",
      deliveryAddress: "8 Lake View Apartments, Mumbai",
      items: [
        { item: cbItems.find((i) => i.name === "Veggie Wrap")!, qty: 2 },
        { item: cbItems.find((i) => i.name === "Strawberry Soft Serve")!, qty: 1 },
      ],
      riderId: riderUsers[1],
      daysAgo: 1,
    },
    // Rahul — delivered Green Leaf order
    {
      customerId: customerUsers[2].id,
      restaurantId: greenLeaf.id,
      status: "DELIVERED",
      deliveryAddress: "15 Defence Colony, Delhi",
      items: [
        { item: glItems.find((i) => i.name === "Lentil Soup")!, qty: 1 },
        { item: glItems.find((i) => i.name === "Avocado Toast")!, qty: 1 },
      ],
      riderId: riderUsers[2],
      daysAgo: 2,
    },
    // Sneha — out for delivery
    {
      customerId: customerUsers[3].id,
      restaurantId: spiceGarden.id,
      status: "OUT_FOR_DELIVERY",
      deliveryAddress: "42 Sector 18, Noida",
      items: [
        { item: sgItems.find((i) => i.name === "Dal Tadka")!, qty: 1 },
        { item: sgItems.find((i) => i.name === "Tandoori Roti")!, qty: 2 },
        { item: sgItems.find((i) => i.name === "Mango Lassi")!, qty: 1 },
      ],
      riderId: riderUsers[0],
      daysAgo: 0,
    },
    // Karan — delivered Crunch Burgers
    {
      customerId: customerUsers[4].id,
      restaurantId: crunchBurgers.id,
      status: "DELIVERED",
      deliveryAddress: "3 Marine Lines, Pune",
      items: [
        { item: cbItems.find((i) => i.name === "Classic Smash Burger")!, qty: 1 },
        { item: cbItems.find((i) => i.name === "Loaded Cheese Fries")!, qty: 1 },
        { item: cbItems.find((i) => i.name === "Chocolate Milkshake")!, qty: 1 },
      ],
      riderId: riderUsers[1],
      daysAgo: 1,
    },
  ];

  for (const o of seedOrders) {
    const totalPrice = o.items.reduce((s, { item, qty }) => s + item.price * qty, 0);
    const totalCalories = o.items.reduce((s, { item, qty }) => s + item.calories * qty, 0);
    const createdAt = new Date(Date.now() - o.daysAgo * 24 * 60 * 60 * 1000);

    // Skip if a matching order already exists (idempotent re-seed)
    const existing = await prisma.order.findFirst({
      where: {
        customerId: o.customerId,
        restaurantId: o.restaurantId,
        status: o.status,
        deliveryAddress: o.deliveryAddress,
      },
    });
    if (existing) continue;

    const order = await prisma.order.create({
      data: {
        customerId: o.customerId,
        restaurantId: o.restaurantId,
        status: o.status,
        totalPrice,
        totalCalories,
        deliveryAddress: o.deliveryAddress,
        createdAt,
        updatedAt: createdAt,
        items: {
          create: o.items.map(({ item, qty }) => ({
            menuItemId: item.id,
            quantity: qty,
            priceSnapshot: item.price,
            caloriesSnapshot: item.calories,
          })),
        },
      },
    });

    // Attach delivery assignment for completed/active orders
    if (o.riderId) {
      const deliveryStatus =
        o.status === "DELIVERED"
          ? "DELIVERED"
          : o.status === "OUT_FOR_DELIVERY"
          ? "ON_THE_WAY"
          : "ASSIGNED";

      await prisma.deliveryAssignment.create({
        data: {
          orderId: order.id,
          riderId: o.riderId,
          status: deliveryStatus,
          pickedUpAt:
            deliveryStatus !== "ASSIGNED" ? new Date(createdAt.getTime() + 15 * 60 * 1000) : null,
          deliveredAt:
            deliveryStatus === "DELIVERED" ? new Date(createdAt.getTime() + 45 * 60 * 1000) : null,
          createdAt,
        },
      });
    }
  }

  // ── Daily Logs ─────────────────────────────────────────────────────────────
  // Seed today's partial daily log for each customer based on their DELIVERED orders today
  // For realism, give each customer a partial log showing interesting nutrient states

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyLogSeeds = [
    // Arjun — good protein, low fiber
    {
      userId: customerUsers[0].id,
      caloriesConsumed: 820,
      proteinConsumed: 48,
      carbsConsumed: 95,
      fatConsumed: 18,
      fiberConsumed: 9,
    },
    // Priya — low protein, moderate everything else
    {
      userId: customerUsers[1].id,
      caloriesConsumed: 560,
      proteinConsumed: 18,
      carbsConsumed: 80,
      fatConsumed: 14,
      fiberConsumed: 8,
    },
    // Rahul — sedentary, over on fat, low fiber
    {
      userId: customerUsers[2].id,
      caloriesConsumed: 1100,
      proteinConsumed: 28,
      carbsConsumed: 130,
      fatConsumed: 42,
      fiberConsumed: 5,
    },
    // Sneha — very active, running low on calories
    {
      userId: customerUsers[3].id,
      caloriesConsumed: 900,
      proteinConsumed: 55,
      carbsConsumed: 100,
      fatConsumed: 22,
      fiberConsumed: 16,
    },
    // Karan — just got started, mostly empty
    {
      userId: customerUsers[4].id,
      caloriesConsumed: 300,
      proteinConsumed: 12,
      carbsConsumed: 40,
      fatConsumed: 10,
      fiberConsumed: 3,
    },
  ];

  for (const log of dailyLogSeeds) {
    await prisma.dailyLog.upsert({
      where: { userId_date: { userId: log.userId, date: today } },
      update: {
        caloriesConsumed: log.caloriesConsumed,
        proteinConsumed: log.proteinConsumed,
        carbsConsumed: log.carbsConsumed,
        fatConsumed: log.fatConsumed,
        fiberConsumed: log.fiberConsumed,
      },
      create: {
        userId: log.userId,
        date: today,
        ...log,
      },
    });
  }

  console.log("✅ Seed complete!");
  console.log("\nTest accounts (all passwords: password123):");
  console.log("  Customers: arjun@example.com, priya@example.com, rahul@example.com,");
  console.log("             sneha@example.com, karan@example.com");
  console.log("  Merchants: owner@greenleaf.com, owner@spicegarden.com, owner@crunchburgers.com");
  console.log("  Riders:    ravi.kumar@rider.com, sanjay.patel@rider.com, dev.singh@rider.com");
  console.log("\nMenu items seeded:");
  console.log("  Green Leaf Kitchen: 10 items (healthy)");
  console.log("  Spice Garden:       10 items (mixed)");
  console.log("  Crunch Burgers:     10 items (indulgent)");
  console.log("  Total:              30 items");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
