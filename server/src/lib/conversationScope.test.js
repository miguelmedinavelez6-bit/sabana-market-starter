const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildConversationAccessQuery,
  canAccessConversation,
  getLegacySellerIdFromUser,
} = require('./conversationScope');

test('buildConversationAccessQuery includes buyer, seller and legacy seller identifiers', () => {
  const user = { id: 'u1', fullName: 'Mateo Pérez' };
  const query = buildConversationAccessQuery(user);

  assert.deepEqual(query, {
    $or: [
      { buyerId: 'u1' },
      { sellerId: 'u1' },
      { sellerId: getLegacySellerIdFromUser(user) },
      { sellerName: 'Mateo Pérez' },
    ],
  });
});

test('canAccessConversation accepts seller by id or by legacy encoded name', () => {
  const user = { id: 'seller-1', fullName: 'Mateo Pérez' };

  assert.equal(canAccessConversation({ sellerId: 'seller-1' }, user), true);
  assert.equal(canAccessConversation({ sellerId: encodeURIComponent('Mateo Pérez') }, user), true);
  assert.equal(canAccessConversation({ buyerId: 'buyer-1', sellerName: 'Otra Persona' }, user), false);
});
