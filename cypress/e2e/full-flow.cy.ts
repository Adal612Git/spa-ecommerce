/// <reference types="cypress" />

describe('checkout flow', () => {
  it('registers, logs in, creates order and processes webhook', () => {
    const api = Cypress.env('apiUrl');
    const email = `user${Date.now()}@test.com`;
    const password = 'Password123';

    cy.request('POST', `${api}/auth/register`, { email, password }).its('status').should('eq', 201);

    cy.request('POST', `${api}/auth/login`, { email, password })
      .its('body.token')
      .then((token) => {
        cy.request({
          method: 'POST',
          url: `${api}/checkout/create-order`,
          body: { items: [{ productId: 1, qty: 1 }] },
          headers: { Authorization: `Bearer ${token}` },
        }).then((orderRes) => {
          const orderId = orderRes.body.orderId;

          // simulate MercadoPago webhook using mock mode
          cy.request('POST', `${api}/webhook/mercadopago`, {
            mp_payment_id: 'test-payment',
            orderId,
            payment_status: 'approved',
          }).its('status').should('eq', 200);

          // verify order status updated to APPROVED
          cy.task('getOrder', orderId).its('status').should('eq', 'APPROVED');
        });
      });
  });
});
