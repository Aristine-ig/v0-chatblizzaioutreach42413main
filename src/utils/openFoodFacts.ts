export interface OpenFoodFactsProduct {
  product_name: string;
  serving_size?: string;
  nutriments: {
    'energy-kcal_100g'?: number;
    'energy-kcal_serving'?: number;
    'proteins_100g'?: number;
    'proteins_serving'?: number;
    'carbohydrates_100g'?: number;
    'carbohydrates_serving'?: number;
    'fat_100g'?: number;
    'fat_serving'?: number;
    'fiber_100g'?: number;
    'fiber_serving'?: number;
    'sugars_100g'?: number;
    'sugars_serving'?: number;
    'sodium_100g'?: number;
    'sodium_serving'?: number;
  };
  brands?: string;
  quantity?: string;
}

export interface ProductNutrition {
  foodName: string;
  description: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

function estimateServingSize(quantity?: string): { grams: number; description: string } {
  if (!quantity) return { grams: 100, description: '100g' };

  const lowerQuantity = quantity.toLowerCase();
  const match = quantity.match(/(\d+(?:\.\d+)?)/);
  const amount = match ? parseFloat(match[0]) : 1;

  if (lowerQuantity.includes('ml') || lowerQuantity.includes('l')) {
    return { grams: Math.round(amount), description: `${amount}ml` };
  }
  if (lowerQuantity.includes('g') || lowerQuantity.includes('kg')) {
    return { grams: Math.round(amount), description: `${amount}g` };
  }
  if (lowerQuantity.includes('oz')) {
    return { grams: Math.round(amount * 28.35), description: `${amount}oz` };
  }
  if (lowerQuantity.includes('cup')) {
    return { grams: Math.round(amount * 240), description: `${amount} cup` };
  }
  if (lowerQuantity.includes('portion') || lowerQuantity.includes('serving')) {
    return { grams: Math.round(amount * 100), description: `${amount} serving` };
  }
  if (lowerQuantity.includes('piece') || lowerQuantity.includes('unit')) {
    return { grams: 100, description: '100g per unit' };
  }

  return { grams: 100, description: '100g' };
}

export async function searchProductByBarcode(barcode: string): Promise<ProductNutrition | null> {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return null;
    }

    const product: OpenFoodFactsProduct = data.product;
    const nutriments = product.nutriments;

    const useServingData = nutriments['energy-kcal_serving'] !== undefined;

    let calories: number;
    let protein: number;
    let carbs: number;
    let fats: number;
    let fiber: number;
    let sugar: number;
    let sodium: number;
    let servingSizeDescription: string;

    if (useServingData) {
      calories = nutriments['energy-kcal_serving'] || 0;
      protein = nutriments['proteins_serving'] || 0;
      carbs = nutriments['carbohydrates_serving'] || 0;
      fats = nutriments['fat_serving'] || 0;
      fiber = nutriments['fiber_serving'] || 0;
      sugar = nutriments['sugars_serving'] || 0;
      sodium = nutriments['sodium_serving'] || 0;
      servingSizeDescription = product.serving_size || '1 serving';
    } else {
      const perHundred = {
        calories: nutriments['energy-kcal_100g'] || 0,
        protein: nutriments['proteins_100g'] || 0,
        carbs: nutriments['carbohydrates_100g'] || 0,
        fats: nutriments['fat_100g'] || 0,
        fiber: nutriments['fiber_100g'] || 0,
        sugar: nutriments['sugars_100g'] || 0,
        sodium: nutriments['sodium_100g'] || 0,
      };

      const servingEstimate = estimateServingSize(product.quantity);

      if (servingEstimate.grams === 100) {
        calories = perHundred.calories;
        protein = perHundred.protein;
        carbs = perHundred.carbs;
        fats = perHundred.fats;
        fiber = perHundred.fiber;
        sugar = perHundred.sugar;
        sodium = perHundred.sodium;
        servingSizeDescription = '100g';
      } else {
        const multiplier = servingEstimate.grams / 100;
        calories = perHundred.calories * multiplier;
        protein = perHundred.protein * multiplier;
        carbs = perHundred.carbs * multiplier;
        fats = perHundred.fats * multiplier;
        fiber = perHundred.fiber * multiplier;
        sugar = perHundred.sugar * multiplier;
        sodium = perHundred.sodium * multiplier;
        servingSizeDescription = servingEstimate.description;
      }
    }

    const foodName = product.product_name || 'Unknown Product';
    const brandInfo = product.brands ? ` (${product.brands})` : '';
    const description = `${foodName}${brandInfo}`;

    return {
      foodName,
      description,
      servingSize: servingSizeDescription,
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fats: Math.round(fats * 10) / 10,
      fiber: Math.round(fiber * 10) / 10,
      sugar: Math.round(sugar * 10) / 10,
      sodium: Math.round(sodium * 10) / 10,
    };
  } catch (error) {
    console.error('Error fetching product data:', error);
    return null;
  }
}

async function searchUSDAFoods(query: string): Promise<ProductNutrition[]> {
  try {
    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=DEMO_KEY&query=${encodeURIComponent(query)}&pageSize=10&dataType=Survey (FNDDS),Foundation,SR Legacy`
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (!data.foods || data.foods.length === 0) {
      return [];
    }

    return data.foods
      .filter((food: any) => {
        return food.foodNutrients && food.foodNutrients.length > 0;
      })
      .slice(0, 8)
      .map((food: any) => {
        const nutrients = food.foodNutrients || [];

        const getNutrient = (nutrientId: number) => {
          const nutrient = nutrients.find((n: any) => n.nutrientId === nutrientId);
          return nutrient ? nutrient.value : 0;
        };

        const calories = getNutrient(1008);
        const protein = getNutrient(1003);
        const carbs = getNutrient(1005);
        const fats = getNutrient(1004);
        const fiber = getNutrient(1079);
        const sugar = getNutrient(2000);
        const sodium = getNutrient(1093);

        const servingSize = food.servingSize && food.servingSizeUnit
          ? `${food.servingSize}${food.servingSizeUnit}`
          : '100g';

        return {
          foodName: food.description || 'Unknown Food',
          description: food.brandOwner
            ? `${food.description} (${food.brandOwner})`
            : food.description || 'Unknown Food',
          servingSize,
          calories: Math.round(calories),
          protein: Math.round(protein * 10) / 10,
          carbs: Math.round(carbs * 10) / 10,
          fats: Math.round(fats * 10) / 10,
          fiber: Math.round(fiber * 10) / 10,
          sugar: Math.round(sugar * 10) / 10,
          sodium: Math.round(sodium * 10) / 10,
        };
      });
  } catch (error) {
    console.error('Error searching USDA foods:', error);
    return [];
  }
}

export async function searchFoodByName(query: string): Promise<ProductNutrition[]> {
  try {
    const [openFoodResults, usdaResults] = await Promise.all([
      searchOpenFoodFacts(query),
      searchUSDAFoods(query)
    ]);

    const allResults = [...openFoodResults, ...usdaResults];

    const validResults = allResults.filter(food =>
      food.calories > 0 || food.protein > 0 || food.carbs > 0 || food.fats > 0
    );

    const uniqueResults = validResults.filter((food, index, self) =>
      index === self.findIndex((f) =>
        f.foodName.toLowerCase() === food.foodName.toLowerCase()
      )
    );

    return uniqueResults.slice(0, 10);
  } catch (error) {
    console.error('Error searching food:', error);
    return [];
  }
}

async function searchOpenFoodFacts(query: string): Promise<ProductNutrition[]> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&sort_by=unique_scans_n&page_size=10&json=true&fields=product_name,brands,nutriments,serving_size,quantity`
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (!data.products || data.products.length === 0) {
      return [];
    }

    return data.products
      .filter((product: any) => {
        return product.product_name && product.nutriments &&
               Object.keys(product.nutriments).length > 0;
      })
      .map((product: any) => {
        const nutriments = product.nutriments || {};
        const useServingData = nutriments['energy-kcal_serving'] !== undefined;

        let calories: number;
        let protein: number;
        let carbs: number;
        let fats: number;
        let fiber: number;
        let sugar: number;
        let sodium: number;
        let servingSizeDescription: string;

        if (useServingData) {
          calories = nutriments['energy-kcal_serving'] || 0;
          protein = nutriments['proteins_serving'] || 0;
          carbs = nutriments['carbohydrates_serving'] || 0;
          fats = nutriments['fat_serving'] || 0;
          fiber = nutriments['fiber_serving'] || 0;
          sugar = nutriments['sugars_serving'] || 0;
          sodium = nutriments['sodium_serving'] || 0;
          servingSizeDescription = product.serving_size || '1 serving';
        } else {
          const perHundred = {
            calories: nutriments['energy-kcal_100g'] || 0,
            protein: nutriments['proteins_100g'] || 0,
            carbs: nutriments['carbohydrates_100g'] || 0,
            fats: nutriments['fat_100g'] || 0,
            fiber: nutriments['fiber_100g'] || 0,
            sugar: nutriments['sugars_100g'] || 0,
            sodium: nutriments['sodium_100g'] || 0,
          };

          const servingEstimate = estimateServingSize(product.quantity);

          if (servingEstimate.grams === 100) {
            calories = perHundred.calories;
            protein = perHundred.protein;
            carbs = perHundred.carbs;
            fats = perHundred.fats;
            fiber = perHundred.fiber;
            sugar = perHundred.sugar;
            sodium = perHundred.sodium;
            servingSizeDescription = '100g';
          } else {
            const multiplier = servingEstimate.grams / 100;
            calories = perHundred.calories * multiplier;
            protein = perHundred.protein * multiplier;
            carbs = perHundred.carbs * multiplier;
            fats = perHundred.fats * multiplier;
            fiber = perHundred.fiber * multiplier;
            sugar = perHundred.sugar * multiplier;
            sodium = perHundred.sodium * multiplier;
            servingSizeDescription = servingEstimate.description;
          }
        }

        const foodName = product.product_name || 'Unknown Product';
        const brandInfo = product.brands ? ` (${product.brands})` : '';
        const description = `${foodName}${brandInfo}`;

        return {
          foodName,
          description,
          servingSize: servingSizeDescription,
          calories: Math.round(calories),
          protein: Math.round(protein * 10) / 10,
          carbs: Math.round(carbs * 10) / 10,
          fats: Math.round(fats * 10) / 10,
          fiber: Math.round(fiber * 10) / 10,
          sugar: Math.round(sugar * 10) / 10,
          sodium: Math.round(sodium * 10) / 10,
        };
      });
  } catch (error) {
    console.error('Error searching Open Food Facts:', error);
    return [];
  }
}
