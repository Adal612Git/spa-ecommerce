/// <reference types="cypress" />

describe('checkout flow', () => {
  it('registers, adds product to cart, creates order and processes webhook', () => {
    const api = Cypress.env('apiUrl');
    const email = `user${Date.now()}@test.com`;
    const password = 'Password123';

    cy.task('createProduct', {
      name: 'Test Product',
      slug: `test-product-${Date.now()}`,
      price_cents: 500,
      stock: 10,
    }).then((product) => {
      const productId = product.id;

      cy.request('POST', `${api}/auth/register`, { email, password })
        .its('status')
        .should('eq', 201);

      cy.request('POST', `${api}/auth/login`, { email, password })
        .its('body.token')
        .then((token) => {
          const cart = [] as { productId: number; qty: number }[];

          // simulate user adding product to cart
          cart.push({ productId, qty: 1 });
          expect(cart).to.have.length(1);

          cy.request({
            method: 'POST',
            url: `${api}/checkout/create-order`,
            body: { items: cart },
            headers: { Authorization: `Bearer ${token}` },
          }).then((orderRes) => {
            const orderId = orderRes.body.orderId;

            // simulate MercadoPago webhook using mock mode
            cy.request('POST', `${api}/webhook/mercadopago`, {
              mp_payment_id: 'test-payment',
              orderId,
              payment_status: 'approved',
            })
              .its('status')
              .should('eq', 200);

            // verify order status updated to APPROVED
            cy.task('getOrder', orderId).its('status').should('eq', 'APPROVED');
          });
        });
    });
  });
});
