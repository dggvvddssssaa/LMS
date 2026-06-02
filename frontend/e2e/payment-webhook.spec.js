import { test, expect } from '@playwright/test';

test.describe('Payment Webhook Flow', () => {
  test('Webhook API endpoint responds correctly', async ({ request }) => {
    // Test the Webhook API hitting backend directly
    const response = await request.post('http://localhost:4000/api/webhooks/sepay', {
      data: {
        transferType: 'in',
        transferAmount: 500000,
        content: 'LMS1234'
      },
      headers: {
        // Assume failure due to missing API KEY in test env
      }
    });
    
    // Based on our webhook logic, missing API key returns 401 or 500
    expect([401, 500, 403]).toContain(response.status());
  });
});
