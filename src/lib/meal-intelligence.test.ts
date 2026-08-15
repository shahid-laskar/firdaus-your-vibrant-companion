import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { rankRecipes, weekToAbsolute, type Recipe } from "./meal-intelligence";

describe("Meal Intelligence", () => {
  const recipes: Recipe[] = [
    { id: "1", name: "Spaghetti", items: "pasta" },
    { id: "2", name: "Tacos", items: "shells, beef" },
    { id: "3", name: "Salad", items: "lettuce" },
    { id: "4", name: "Soup", items: "broth" },
    { id: "5", name: "New Recipe", items: "unknown" }, // never used
  ];

  test("weekToAbsolute parses monotonic correctly", () => {
    const a = weekToAbsolute("2026-W01");
    const b = weekToAbsolute("2026-W02");
    const c = weekToAbsolute("2027-W01");

    assert.ok(b > a);
    assert.ok(c > b);
    assert.equal(b - a, 1);
    assert.equal(c - a, 52); // approx, perfectly fine for our math
  });

  test("rankRecipes basic scoring", () => {
    const history = {
      "2026-W01": { "Mon-Dinner": "Spaghetti", "Tue-Dinner": "Tacos" },
      "2026-W02": { "Mon-Dinner": "Spaghetti", "Wed-Dinner": "Salad" },
      // Tacos used in W01 (3 weeks ago)
      // Salad used in W02 (2 weeks ago)
      // Spaghetti used in W01 and W02
      // Soup used never, but added
      "2026-W04": {}, // empty current week
    };

    const ranked = rankRecipes(recipes, history, "2026-W04");

    // Let's verify stats
    const spaghetti = ranked.find((r) => r.recipe.name === "Spaghetti")!;
    assert.equal(spaghetti.historicalCount, 2);
    assert.equal(spaghetti.weeksSinceUsed, 2); // W04 - W02

    const tacos = ranked.find((r) => r.recipe.name === "Tacos")!;
    assert.equal(tacos.historicalCount, 1);
    assert.equal(tacos.weeksSinceUsed, 3); // W04 - W01

    const newRecipe = ranked.find((r) => r.recipe.name === "New Recipe")!;
    assert.equal(newRecipe.historicalCount, 0);
    assert.equal(newRecipe.weeksSinceUsed, 12); // fallback
  });

  test("rankRecipes penalizes recent meals heavily", () => {
    const history = {
      "2026-W10": { Mon: "Spaghetti" }, // Last week
      "2026-W11": { Mon: "Tacos" }, // This week
    };

    const ranked = rankRecipes(recipes, history, "2026-W11");

    const spaghetti = ranked.find((r) => r.recipe.name === "Spaghetti")!;
    const tacos = ranked.find((r) => r.recipe.name === "Tacos")!;

    assert.ok(spaghetti.score < 0); // weeksSinceUsed = 1
    assert.ok(tacos.score < 0); // weeksSinceUsed = 0

    // Salad, Soup, New Recipe should be ranked higher because they weren't used recently
    assert.equal(ranked[0]?.recipe.name, "New Recipe"); // alphabetically first among ties?
    // Salad, Soup, New Recipe all have 0 count, 12 weeks fallback = 18 score
    // Sorted by score (18), then alphabetically: New Recipe, Salad, Soup
    assert.equal(ranked[0]?.recipe.name, "New Recipe");
    assert.equal(ranked[1]?.recipe.name, "Salad");
    assert.equal(ranked[2]?.recipe.name, "Soup");
  });

  test("rankRecipes favors high frequency staples over time", () => {
    const history = {
      "2026-W01": { M: "Soup" },
      "2026-W02": { M: "Soup" },
      "2026-W03": { M: "Soup" },
      "2026-W04": { M: "Soup" },
      "2026-W05": { M: "Salad" }, // Salad used once
    };

    // Current is W08
    // Soup count = 4, weeksSince = 4 (W08 - W04). Score = 4*2 + 4*1.5 = 14
    // Salad count = 1, weeksSince = 3 (W08 - W05). Score = 1*2 + 3*1.5 = 6.5
    const ranked = rankRecipes(recipes, history, "2026-W08");

    const soup = ranked.find((r) => r.recipe.name === "Soup")!;
    const salad = ranked.find((r) => r.recipe.name === "Salad")!;

    assert.ok(soup.score > salad.score);
  });

  test("handles empty recipes", () => {
    const ranked = rankRecipes([], {}, "2026-W01");
    assert.equal(ranked.length, 0);
  });
});
