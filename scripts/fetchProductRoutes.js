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
    const json = await res.json();
    const products = Array.isArray(json.data) ? json.data : [];
    return products.map((p) => `/product/${p.id}`);
  } catch (err) {
    console.error('Error fetching product routes:', err);
    return [];
  }
}
