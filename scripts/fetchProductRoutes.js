export async function fetchProductRoutes(apiUrl) {
  if (!apiUrl) {
    return [];
  }
  try {
    const res = await fetch(`${apiUrl}/api/products`);
    if (!res.ok) {
      console.error(`Failed to fetch products: ${res.status}`);
      return [];
    }
    const products = await res.json();
    if (!Array.isArray(products)) {
      return [];
    }
    return products.map((p) => `/product/${p.id}`);
  } catch (err) {
    console.error('Error fetching product routes:', err);
    return [];
  }
}
