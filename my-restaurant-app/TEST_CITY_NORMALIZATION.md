# City Normalization Testing

## Quick Browser Console Tests

Copy and paste these into your browser console to test city normalization:

### Test Bulgarian → English Normalization

```javascript
// Import the function (only works if module is loaded)
// Or copy the normalizeCityName function directly

function normalizeCityName(city) {
  if (!city) return "";

  let normalized = city.toLowerCase().trim();

  normalized = normalized
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const cityMappings = {
    sofia: "sofia",
    софия: "sofia",
    софиа: "sofia",
    plovdiv: "plovdiv",
    пловдив: "plovdiv",
    varna: "varna",
    варна: "varna",
    burgas: "burgas",
    бургас: "burgas",
    bourgas: "burgas",
    ruse: "ruse",
    русе: "ruse",
    rousse: "ruse",
    "stara zagora": "starazagora",
    "стара загора": "starazagora",
    starazagora: "starazagora",
    pleven: "pleven",
    плевен: "pleven",
    sliven: "sliven",
    сливен: "sliven",
    dobrich: "dobrich",
    добрич: "dobrich",
    dobric: "dobrich",
    shumen: "shumen",
    шумен: "shumen",
    pernik: "pernik",
    перник: "pernik",
    haskovo: "haskovo",
    хасково: "haskovo",
    yambol: "yambol",
    ямбол: "yambol",
    pazardzhik: "pazardzhik",
    пазарджик: "pazardzhik",
    pazardjik: "pazardzhik",
    blagoevgrad: "blagoevgrad",
    благоевград: "blagoevgrad",
    "veliko tarnovo": "velikotarnovo",
    "велико търново": "velikotarnovo",
    "veliko turnovo": "velikotarnovo",
    velikotarnovo: "velikotarnovo",
    vratsa: "vratsa",
    враца: "vratsa",
    vraca: "vratsa",
    gabrovo: "gabrovo",
    габрово: "gabrovo",
    vidin: "vidin",
    видин: "vidin",
    kazanlak: "kazanlak",
    казанлък: "kazanlak",
    kazanluk: "kazanlak",
    asenovgrad: "asenovgrad",
    асеновград: "asenovgrad",
    kyustendil: "kyustendil",
    кюстендил: "kyustendil",
    montana: "montana",
    монтана: "montana",
    lovech: "lovech",
    ловеч: "lovech",
    kardzhali: "kardzhali",
    кърджали: "kardzhali",
    kardshali: "kardzhali",
    smolyan: "smolyan",
    смолян: "smolyan",
    targovishte: "targovishte",
    търговище: "targovishte",
    razgrad: "razgrad",
    разград: "razgrad",
    silistra: "silistra",
    силистра: "silistra",
  };

  if (cityMappings[normalized]) {
    return cityMappings[normalized];
  }

  return normalized;
}

// Test cases
const testCases = [
  ["София", "sofia"],
  ["Sofia", "sofia"],
  ["СОФИЯ", "sofia"],
  ["sofia", "sofia"],
  ["Пловдив", "plovdiv"],
  ["Plovdiv", "plovdiv"],
  ["Варна", "varna"],
  ["Varna", "varna"],
  ["Бургас", "burgas"],
  ["Burgas", "burgas"],
  ["Bourgas", "burgas"],
  ["Стара Загора", "starazagora"],
  ["Stara Zagora", "starazagora"],
  ["Велико Търново", "velikotarnovo"],
  ["Veliko Tarnovo", "velikotarnovo"],
  ["  Sofia  ", "sofia"], // With spaces
  ["ВАРНА", "varna"], // All caps
];

console.log("City Normalization Tests:");
console.log("=".repeat(50));

let passed = 0;
let failed = 0;

testCases.forEach(([input, expected]) => {
  const result = normalizeCityName(input);
  const status = result === expected ? "✓ PASS" : "✗ FAIL";

  if (result === expected) {
    passed++;
  } else {
    failed++;
  }

  console.log(`${status}: "${input}" → "${result}" (expected: "${expected}")`);
});

console.log("=".repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);
```

### Test Restaurant Matching

```javascript
// Simulate restaurant data
const mockRestaurants = [
  { restaurant_id: "1", name: "Sofia Restaurant", city: "Sofia" },
  { restaurant_id: "2", name: "Plovdiv Restaurant", city: "Plovdiv" },
  { restaurant_id: "3", name: "Varna Restaurant", city: "Varna" },
  { restaurant_id: "4", name: "Burgas Restaurant", city: "Burgas" },
];

// Test matching with Cyrillic city from IP
console.log("\nRestaurant Matching Tests:");
console.log("=".repeat(50));

const userCities = ["София", "sofia", "СОФИЯ", "Пловдив", "plovdiv", "Варна"];

userCities.forEach((userCity) => {
  const normalizedUser = normalizeCityName(userCity);
  const match = mockRestaurants.find(
    (r) => normalizeCityName(r.city) === normalizedUser
  );

  console.log(`User City: "${userCity}" (normalized: "${normalizedUser}")`);
  console.log(`  → ${match ? `✓ Matched: ${match.name}` : "✗ No match"}`);
});
```

## Expected Results

### All These Should Match to 'sofia':

- София
- Sofia
- СОФИЯ
- sofia
- SoFiA
- софиа

### All These Should Match to 'plovdiv':

- Пловдив
- Plovdiv
- plovdiv
- ПЛОВДИВ

### All These Should Match to 'starazagora':

- Стара Загора
- Stara Zagora
- stara zagora
- СТАРА ЗАГОРА

## Debug Your Current Setup

Run this in the browser console to see what's happening:

```javascript
// Check current IP geolocation cache
const ipCache = localStorage.getItem("ip_geolocation");
if (ipCache) {
  const data = JSON.parse(ipCache);
  console.log("Your cached IP location:", data.location);
  console.log("City from IP:", data.location.city);
  console.log("Normalized:", normalizeCityName(data.location.city));
} else {
  console.log("No IP geolocation cached");
}

// Check saved restaurant
const savedRest = localStorage.getItem("selectedRestaurant");
if (savedRest) {
  const rest = JSON.parse(savedRest);
  console.log("Saved restaurant:", rest.name || rest[8]);
  console.log("Restaurant city:", rest.city || rest[3]);
  console.log("Normalized:", normalizeCityName(rest.city || rest[3]));
} else {
  console.log("No restaurant saved");
}
```

## Force Test with Sofia

```javascript
// Clear everything
localStorage.removeItem("selectedRestaurant");

// Set IP to return София (Bulgarian)
localStorage.setItem(
  "ip_geolocation",
  JSON.stringify({
    location: {
      city: "София", // Bulgarian name
      country: "Bulgaria",
      countryCode: "BG",
      latitude: 42.6977,
      longitude: 23.3219,
    },
    timestamp: Date.now(),
  })
);

// Reload the page
console.log("Reloading page to test Sofia matching...");
setTimeout(() => location.reload(), 1000);
```

## Check Restaurant Cities in Database

```javascript
// Fetch all restaurants and see their city names
fetch("YOUR_API_URL/restaurant/restaurants")
  .then((r) => r.json())
  .then((restaurants) => {
    console.log("All restaurant cities in database:");
    const cities = [...new Set(restaurants.map((r) => r.city || r[3]))];
    cities.forEach((city) => {
      console.log(`  - "${city}" → normalized: "${normalizeCityName(city)}"`);
    });
  });
```

## What to Look For

### ✓ Success Indicators:

```
[IP Geolocation] Looking for restaurants in user city: София → normalized: sofia
[IP Geolocation] Comparing: Sofia → sofia with sofia
[IP Geolocation] ✓ MATCH! Found restaurant: Sofia Restaurant in Sofia
```

### ✗ Failure Indicators:

```
[IP Geolocation] Looking for restaurants in user city: София → normalized: софия
[IP Geolocation] Comparing: Sofia → sofia with софия
[IP Geolocation] ✗ No restaurant found for city: София
```

If you see the failure pattern, it means the normalization isn't working correctly.

## Quick Fix Test

If normalization still doesn't work, try this in the console:

```javascript
// Manual test
const userCity = "София";
const restaurantCity = "Sofia";

console.log("User city:", userCity);
console.log("User normalized:", normalizeCityName(userCity));
console.log("Restaurant city:", restaurantCity);
console.log("Restaurant normalized:", normalizeCityName(restaurantCity));
console.log(
  "Do they match?",
  normalizeCityName(userCity) === normalizeCityName(restaurantCity)
);
```

This should output:

```
User city: София
User normalized: sofia
Restaurant city: Sofia
Restaurant normalized: sofia
Do they match? true
```
