/// <reference types="cypress" />

describe('checkout flow', () => {
  it('registers, adds product to cart, creates order and processes webhook', () => {
    const api = Cypress.env('apiUrl');
    const email = `user${Date.now()}@test.com`;
    const password = 'Password123';

    cy.task('createProduct', {
      name: 'Test Product',
      slug: `test-product-${Date.now()}`,
      priceCents: 500,
      stock: 10,
    }).then((product) => {
      const productId = product.id;

      cy.request('POST', `${api}/auth/register`, { email, password })
        .its('status')
        .should('eq', 201);

      cy.request('POST', `${api}/auth/login`, { email, password })
        .its('body.token')
        .then((token) => {
          cy.request({
            method: 'POST',
            url: `${api}/cart`,
            body: { productId, quantity: 1 },
            headers: { Authorization: `Bearer ${token}` },
          })
            .its('status')
            .should('eq', 200);

          cy.request({
            method: 'GET',
            url: `${api}/cart`,
            headers: { Authorization: `Bearer ${token}` },
          }).then((cartRes) => {
            const items = cartRes.body.items;
            expect(items).to.have.length(1);
            expect(items[0]).to.include({ productId, quantity: 1 });

            cy.request({
              method: 'POST',
              url: `${api}/checkout/create-order`,
              body: { items },
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

              // verify order status updated to CONFIRMED
              cy.task('getOrder', orderId).its('status').should('eq', 'CONFIRMED');
            });
          });
        });
    });
  });
});
