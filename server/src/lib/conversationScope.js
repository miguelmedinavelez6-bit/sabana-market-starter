function getLegacySellerIdFromUser(user = {}) {
  return encodeURIComponent(user.fullName || '');
}

function buildConversationAccessQuery(user = {}) {
  return {
    $or: [
      { buyerId: String(user.id || '') },
      { sellerId: String(user.id || '') },
      { sellerId: getLegacySellerIdFromUser(user) },
      { sellerName: user.fullName || '' },
    ],
  };
}

function canAccessConversation(conversation = {}, user = {}) {
  return (
    String(conversation.buyerId || '') === String(user.id || '')
    || String(conversation.sellerId || '') === String(user.id || '')
    || String(conversation.sellerId || '') === getLegacySellerIdFromUser(user)
    || String(conversation.sellerName || '') === String(user.fullName || '')
  );
}

module.exports = {
  buildConversationAccessQuery,
  canAccessConversation,
  getLegacySellerIdFromUser,
};
