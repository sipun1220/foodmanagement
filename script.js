// ============ STATE & DATA ============
let currentUser = null;
let listings = [];
let conversations = [];
let selectedConversation = null;
let favorites = [];
let notifications = [];
let reviews = [];
let bookings = [];

const foodCategories = [
    '🍕 Pizza',
    '🍜 Noodles',
    '🥗 Salad',
    '🍲 Soup',
    '🥘 Curry',
    '🍛 Rice Dishes',
    '🍞 Bread & Bakery',
    '🥩 Meat',
    '🍗 Poultry',
    '🐟 Seafood',
    '🥦 Vegetables',
    '🍰 Desserts',
    '🥛 Beverages',
    '🥫 Canned/Packaged'
];

// ============ INITIALIZATION ============
function init() {
    loadDataFromStorage();
    checkUserSession();
    setupEventListeners();
}

function setupEventListeners() {
    document.getElementById('foodFree').addEventListener('change', function() {
        document.getElementById('foodPrice').disabled = this.checked;
        if (this.checked) document.getElementById('foodPrice').value = '0';
    });

    document.getElementById('foodPhoto').addEventListener('change', function(e) {
        handlePhotoUpload(e);
    });

    document.getElementById('searchFood').addEventListener('input', debounce(applyFilters, 500));

    // Populate food categories
    const categorySelect = document.getElementById('foodCategory');
    if (categorySelect) {
        foodCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });
    }
}

// ============ AUTHENTICATION ============
function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        alert('Invalid email or password');
        return;
    }

    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    showAppUI();
}

function handleRegister() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const role = document.getElementById('regRole').value;

    if (!name || !email || !password || !phone || !role) {
        alert('Please fill in all fields');
        return;
    }

    if (!isValidEmail(email)) {
        alert('Please enter a valid email');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find(u => u.email === email)) {
        alert('Email already registered');
        return;
    }

    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
        phone,
        role,
        emailVerified: false,
        phoneVerified: false,
        bio: '',
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    showAppUI();
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('loginForm').style.display = 'flex';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    clearForm('register');
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'flex';
    document.getElementById('registerForm').style.display = 'none';
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'flex';
}

function checkUserSession() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        currentUser = JSON.parse(user);
        showAppUI();
    }
}

function showAppUI() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'flex';
    updateUIForRole();
    updateProfileDisplay();
    updateNotificationBadges();
    showDashboard();
    loadListings();
}

// ============ UI RENDERING ============
function updateProfileDisplay() {
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('userDisplay').textContent = `${currentUser.name} (${currentUser.role})`;
    document.getElementById('logoutBtn').style.display = 'block';
    document.getElementById('logoutBtn').onclick = handleLogout;

    const roleText = currentUser.role === 'donor' ? '🤝 Donor' : '🛍️ Buyer';
    document.getElementById('profileRole').textContent = roleText;

    updateTrustBadges();
    updateProfileForm();
}

function updateTrustBadges() {
    const emailBadge = currentUser.emailVerified 
        ? 'badge verified' 
        : 'badge unverified';
    const phoneBadge = currentUser.phoneVerified 
        ? 'badge verified' 
        : 'badge unverified';

    const emailText = currentUser.emailVerified ? '✅ Email Verified' : '✉️ Email';
    const phoneText = currentUser.phoneVerified ? '✅ Phone Verified' : '📱 Phone';

    document.getElementById('emailBadge').className = emailBadge;
    document.getElementById('phoneBadge').className = phoneBadge;
    document.getElementById('emailBadge').textContent = emailText;
    document.getElementById('phoneBadge').textContent = phoneText;

    if (document.getElementById('emailBadgeDetail')) {
        document.getElementById('emailBadgeDetail').className = emailBadge;
        document.getElementById('emailBadgeDetail').textContent = emailText;
        document.getElementById('phoneBadgeDetail').className = phoneBadge;
        document.getElementById('phoneBadgeDetail').textContent = phoneText;
    }
}

function updateUIForRole() {
    const postNavBtn = document.getElementById('postNavBtn');
    const listingsNavBtn = document.getElementById('listingsNavBtn');

    if (currentUser.role === 'donor') {
        postNavBtn.style.display = 'block';
        listingsNavBtn.textContent = '📝 My Listings';
    } else {
        postNavBtn.style.display = 'none';
        listingsNavBtn.textContent = '🔍 Browse Listings';
    }
}

function updateProfileForm() {
    document.getElementById('profileEditName').value = currentUser.name;
    document.getElementById('profileEditEmail').value = currentUser.email;
    document.getElementById('profileEditPhone').value = currentUser.phone;
    document.getElementById('profileEditBio').value = currentUser.bio || '';
}

// ============ NAVIGATION ============
function showDashboard() {
    showView('dashboardView');
    updateDashboard();
}

function showListings() {
    if (currentUser.role === 'donor') {
        showView('myListingsView');
        loadMyListings();
    } else {
        showView('listingsView');
        loadBrowserListings();
    }
}

function showPostFood() {
    showView('postFoodView');
    clearForm('postFood');
}

function showMessages() {
    showView('messagesView');
    loadConversations();
}

function showProfile() {
    showView('profileView');
    updateProfileForm();
}

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    document.getElementById(viewId).style.display = 'block';

    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if (viewId === 'dashboardView') {
        document.querySelector('.nav-btn').classList.add('active');
    }
}

// ============ FOOD LISTING MANAGEMENT ============
function postFood() {
    const name = document.getElementById('foodName').value.trim();
    const description = document.getElementById('foodDescription').value.trim();
    const quantity = document.getElementById('foodQuantity').value.trim();
    const location = document.getElementById('foodLocation').value.trim();
    const pickupTime = document.getElementById('foodPickupTime').value;
    const price = document.getElementById('foodFree').checked 
        ? 0 
        : parseFloat(document.getElementById('foodPrice').value);
    const safetyCheck = document.getElementById('foodSafetyCheck').checked;
    const photo = document.getElementById('foodPhoto').dataset.base64 || '';
    const category = document.getElementById('foodCategory')?.value || 'Other';
    const editId = document.getElementById('foodSafetyCheck').dataset.editId;

    if (!name || !quantity || !location || !pickupTime) {
        alert('Please fill in all required fields');
        return;
    }

    if (!safetyCheck) {
        alert('You must confirm food safety standards');
        return;
    }

    if (isNaN(price) || price < 0) {
        alert('Please enter a valid price');
        return;
    }

    if (editId) {
        // Edit existing listing
        const listing = listings.find(l => l.id === editId);
        if (listing) {
            listing.name = name;
            listing.description = description;
            listing.quantity = quantity;
            listing.location = location;
            listing.pickupTime = pickupTime;
            listing.price = price;
            listing.category = category;
            if (photo && document.getElementById('foodPhoto').value) {
                listing.photo = photo;
            }
            listing.updatedAt = new Date().toISOString();
        }
        delete document.getElementById('foodSafetyCheck').dataset.editId;
        alert('Listing updated successfully!');
    } else {
        // Create new listing
        const listing = {
            id: Date.now().toString(),
            donorId: currentUser.id,
            donorName: currentUser.name,
            name,
            description,
            quantity,
            location,
            pickupTime,
            price,
            photo,
            category,
            status: 'available',
            createdAt: new Date().toISOString(),
            safetyVerified: true,
            rating: 0,
            reviewCount: 0
        };
        listings.push(listing);
        addNotification(`Food item "${name}" posted! 🎉`, '📝');
        alert('Food item posted successfully!');
    }

    saveListingsToStorage();
    showListings();
}

function loadListings() {
    const stored = localStorage.getItem('listings');
    if (stored) {
        listings = JSON.parse(stored);
    }
}

function loadMyListings() {
    const myListings = listings.filter(l => l.donorId === currentUser.id);
    const container = document.getElementById('myListingsGrid');

    if (myListings.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No listings yet. <a href="#" onclick="showPostFood()">Post your first item</a></p>';
        return;
    }

    container.innerHTML = myListings.map(listing => `
        <div class="listing-card">
            ${listing.photo ? `<img src="${listing.photo}" alt="${listing.name}" class="listing-photo">` : '<div class="no-photo">📷</div>'}
            <div class="listing-content">
                <h3>${listing.name}</h3>
                <p class="listing-status">${listing.status === 'available' ? '✅ Available' : '❌ Booked'}</p>
                <p><strong>Quantity:</strong> ${listing.quantity}</p>
                <p><strong>Location:</strong> ${listing.location}</p>
                <p><strong>Pickup:</strong> ${formatDate(listing.pickupTime)}</p>
                <p><strong>Price:</strong> ${listing.price === 0 ? 'Free' : '$' + listing.price.toFixed(2)}</p>
            </div>
            <div class="listing-actions">
                <button onclick="editListing('${listing.id}')" class="btn-secondary">Edit</button>
                <button onclick="deleteListing('${listing.id}')" class="btn-danger">Delete</button>
            </div>
        </div>
    `).join('');
}

function loadBrowserListings() {
    const availableListings = listings.filter(l => l.status === 'available');
    displayListings(availableListings);
    updateLocationFilter();
    loadCategoryFilters();
}

function loadCategoryFilters() {
    const container = document.getElementById('categoriesContainer');
    container.innerHTML = '<div class="category-filter active" onclick="filterByCategory(\'\', this)">All Foods</div>' +
        foodCategories.map(cat => 
            `<div class="category-filter" onclick="filterByCategory('${cat}', this)">${cat}</div>`
        ).join('');
}

function filterByCategory(category, element) {
    // Update active state
    document.querySelectorAll('.category-filter').forEach(e => e.classList.remove('active'));
    if (element) element.classList.add('active');

    const filtered = category 
        ? listings.filter(l => l.status === 'available' && l.category === category)
        : listings.filter(l => l.status === 'available');

    displayListings(filtered);
}

function displayListings(itemsToDisplay) {
    const container = document.getElementById('listingsGrid');

    if (itemsToDisplay.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No listings match your criteria</p>';
        return;
    }

    container.innerHTML = itemsToDisplay.map(listing => {
        const rating = getAverageRating(listing.donorId);
        const ratingDisplay = rating > 0 ? `${renderStars(rating)} (${rating})` : 'No ratings yet';
        
        return `
        <div class="listing-card">
            <div style="position: relative;">
                ${listing.photo ? `<img src="${listing.photo}" alt="${listing.name}" class="listing-photo">` : '<div class="no-photo">📷</div>'}
                <button class="favorite-btn ${isFavorite(listing.id) ? 'active' : ''}" data-listing-id="${listing.id}" onclick="toggleFavorite('${listing.id}')">
                    ${isFavorite(listing.id) ? '❤️' : '🤍'}
                </button>
            </div>
            <div class="listing-content">
                <h3>${listing.name}</h3>
                <p class="donor-info">🤝 ${listing.donorName}</p>
                <div class="rating-display">
                    ${ratingDisplay}
                </div>
                <p><strong>Category:</strong> ${listing.category || 'Not specified'}</p>
                <p><strong>Quantity:</strong> ${listing.quantity}</p>
                <p><strong>Location:</strong> ${listing.location}</p>
                <p><strong>Pickup:</strong> ${formatDate(listing.pickupTime)}</p>
                <p><strong>Price:</strong> ${listing.price === 0 ? '🎉 Free' : '$' + listing.price.toFixed(2)}</p>
                ${listing.description ? `<p class="description">${listing.description}</p>` : ''}
            </div>
            <button onclick="showBooking('${listing.id}')" class="btn-primary">Buy Now</button>
        </div>
    `}).join('');

    updateFavoriteButtons();
}

function deleteListing(listingId) {
    if (confirm('Delete this listing?')) {
        listings = listings.filter(l => l.id !== listingId);
        saveListingsToStorage();
        loadMyListings();
    }
}

// ============ EDIT LISTING ============
function editListing(listingId) {
    const listing = listings.find(l => l.id === listingId);
    if (!listing || listing.donorId !== currentUser.id) return;

    document.getElementById('foodName').value = listing.name;
    document.getElementById('foodDescription').value = listing.description;
    document.getElementById('foodQuantity').value = listing.quantity;
    document.getElementById('foodLocation').value = listing.location;
    document.getElementById('foodPickupTime').value = listing.pickupTime;
    
    if (listing.price === 0) {
        document.getElementById('foodFree').checked = true;
        document.getElementById('foodPrice').disabled = true;
    } else {
        document.getElementById('foodPrice').value = listing.price;
        document.getElementById('foodFree').checked = false;
    }

    if (listing.photo) {
        document.getElementById('foodPhoto').dataset.base64 = listing.photo;
        document.getElementById('photoPreview').innerHTML = `<img src="${listing.photo}" style="max-width: 100%; border-radius: 4px;">`;
    }

    document.getElementById('foodSafetyCheck').checked = true;

    // Mark mode as edit
    document.getElementById('foodSafetyCheck').dataset.editId = listingId;

    showPostFood();
    window.scrollTo(0, 0);
}

// ============ FAVORITES ============
function toggleFavorite(listingId) {
    const index = favorites.findIndex(f => f.userId === currentUser.id && f.listingId === listingId);
    
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push({
            userId: currentUser.id,
            listingId,
            addedAt: new Date().toISOString()
        });
        addNotification(`Added to favorites!`, '❤️');
    }
    
    saveFavoritesToStorage();
    updateFavoriteButtons();
}

function isFavorite(listingId) {
    return favorites.some(f => f.userId === currentUser.id && f.listingId === listingId);
}

function updateFavoriteButtons() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const listingId = btn.dataset.listingId;
        if (isFavorite(listingId)) {
            btn.classList.add('active');
            btn.textContent = '❤️';
        } else {
            btn.classList.remove('active');
            btn.textContent = '🤍';
        }
    });
}

// ============ RATINGS ============
function rateUser(userId, rating, reviewText) {
    const review = {
        id: Date.now().toString(),
        fromUserId: currentUser.id,
        fromUserName: currentUser.name,
        toUserId: userId,
        rating,
        text: reviewText,
        createdAt: new Date().toISOString()
    };
    
    reviews.push(review);
    saveReviewsToStorage();
    addNotification(`You rated this user ${rating} stars`, '⭐');
}

function getAverageRating(userId) {
    const userReviews = reviews.filter(r => r.toUserId === userId);
    if (userReviews.length === 0) return 0;
    
    const sum = userReviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / userReviews.length).toFixed(1);
}

function getUserReviews(userId) {
    return reviews.filter(r => r.toUserId === userId);
}

function renderStars(rating, maxRating = 5) {
    let stars = '⭐'.repeat(Math.floor(rating));
    if (rating % 1 >= 0.5) stars += '✨';
    return stars.padEnd(maxRating, '☆');
}

// ============ NOTIFICATIONS ============
function addNotification(message, icon = '🔔') {
    notifications.push({
        id: Date.now().toString(),
        userId: currentUser.id,
        message,
        icon,
        createdAt: new Date().toISOString(),
        read: false
    });
    
    saveNotificationsToStorage();
    updateNotificationBadges();
}

function updateNotificationBadges() {
    const unreadCount = notifications.filter(n => 
        n.userId === currentUser.id && !n.read
    ).length;

    const badge = document.querySelector('.notification-badge');
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

function showNotifications() {
    const userNotifications = notifications.filter(n => n.userId === currentUser.id);
    const panel = document.getElementById('notificationsPanel');
    
    if (!panel) return;
    
    if (userNotifications.length === 0) {
        panel.innerHTML = '<div style="padding: 1rem; text-align: center; color: #999;">No notifications</div>';
    } else {
        panel.innerHTML = userNotifications.slice(-10).reverse().map(notif => `
            <div class="notification-item">
                <div class="notification-icon">${notif.icon}</div>
                <div class="notification-content">
                    <div class="notification-message">${notif.message}</div>
                    <div class="notification-time">${formatTime(notif.createdAt)}</div>
                </div>
            </div>
        `).join('');
    }
    
    // Mark as read
    userNotifications.forEach(n => n.read = true);
    saveNotificationsToStorage();
}

// ============ BOOKING STATUS TRACKING ============
function createBooking(listingId, quantity, notes) {
    const listing = listings.find(l => l.id === listingId);
    const booking = {
        id: Date.now().toString(),
        listingId,
        listingName: listing.name,
        buyerId: currentUser.id,
        buyerName: currentUser.name,
        donorId: listing.donorId,
        donorName: listing.donorName,
        quantity,
        notes,
        status: 'pending',
        createdAt: new Date().toISOString(),
        timeline: [
            { status: 'pending', timestamp: new Date().toISOString(), label: 'Booking Created' }
        ]
    };
    
    bookings.push(booking);
    saveBookingsToStorage();
    
    addNotification(`New booking request from ${currentUser.name}`, '📦');
    return booking;
}

function updateBookingStatus(bookingId, newStatus) {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    booking.status = newStatus;
    booking.timeline.push({
        status: newStatus,
        timestamp: new Date().toISOString(),
        label: getStatusLabel(newStatus)
    });
    
    saveBookingsToStorage();
    addNotification(`Booking ${newStatus}: ${booking.listingName}`, '📦');
}

function getStatusLabel(status) {
    const labels = {
        'pending': 'Payment Pending',
        'confirmed': 'Confirmed by Donor',
        'ready': 'Ready for Pickup',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    };
    return labels[status] || status;
}

function getUserBookings(userId) {
    return bookings.filter(b => b.buyerId === userId || b.donorId === userId);
}

// ============ SEARCH ENHANCEMENTS ============
function searchUsers(query) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    return users.filter(u => 
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase())
    ).map(u => ({
        ...u,
        rating: getAverageRating(u.id)
    }));
}

function filterByCategory(category) {
    if (!category) return listings.filter(l => l.status === 'available');
    return listings.filter(l => 
        l.status === 'available' && 
        l.category === category
    );
}

// ============ SEARCH & FILTER ============
function applyFilters() {
    const searchTerm = document.getElementById('searchFood').value.toLowerCase();
    const location = document.getElementById('filterLocation').value;
    const priceFilter = document.getElementById('filterPrice').value;

    let filtered = listings.filter(l => l.status === 'available');

    if (searchTerm) {
        filtered = filtered.filter(l => 
            l.name.toLowerCase().includes(searchTerm) ||
            l.description.toLowerCase().includes(searchTerm)
        );
    }

    if (location) {
        filtered = filtered.filter(l => l.location === location);
    }

    if (priceFilter) {
        filtered = filtered.filter(l => {
            if (priceFilter === 'free') return l.price === 0;
            if (priceFilter === 'low') return l.price > 0 && l.price <= 10;
            if (priceFilter === 'mid') return l.price > 10 && l.price <= 25;
            if (priceFilter === 'high') return l.price > 25;
            return true;
        });
    }

    displayListings(filtered);
}

function updateLocationFilter() {
    const locations = [...new Set(listings.map(l => l.location))];
    const select = document.getElementById('filterLocation');
    const current = select.value;

    select.innerHTML = '<option value="">All Locations</option>' +
        locations.map(loc => `<option value="${loc}">${loc}</option>`).join('');

    select.value = current;
}

// ============ BOOKING SYSTEM ============
function showBooking(listingId) {
    const listing = listings.find(l => l.id === listingId);
    if (!listing) return;

    const modal = document.getElementById('bookingModal');
    document.getElementById('bookingDetails').innerHTML = `
        <p><strong>Item:</strong> ${listing.name}</p>
        <p><strong>Donor:</strong> ${listing.donorName}</p>
        <p><strong>Available Quantity:</strong> ${listing.quantity}</p>
        <p><strong>Location:</strong> ${listing.location}</p>
        <p><strong>Pickup Time:</strong> ${formatDate(listing.pickupTime)}</p>
        <p><strong>Price:</strong> ${listing.price === 0 ? 'Free' : '$' + listing.price.toFixed(2)}</p>
    `;

    modal.dataset.listingId = listingId;
    modal.style.display = 'flex';
}

function closeBooking() {
    document.getElementById('bookingModal').style.display = 'none';
    document.getElementById('bookingQuantity').value = '';
    document.getElementById('bookingNotes').value = '';
}

function confirmBooking() {
    const listingId = document.getElementById('bookingModal').dataset.listingId;
    const quantity = document.getElementById('bookingQuantity').value.trim();
    const notes = document.getElementById('bookingNotes').value.trim();

    if (!quantity) {
        alert('Please enter the quantity you need');
        return;
    }

    const listing = listings.find(l => l.id === listingId);
    const donorId = listing.donorId;

    // Create booking
    const booking = createBooking(listingId, quantity, notes);

    // Create conversation
    const conversationId = `${currentUser.id}-${donorId}-${listingId}`;
    let conversation = conversations.find(c => c.id === conversationId);

    if (!conversation) {
        conversation = {
            id: conversationId,
            listingId,
            buyerId: currentUser.id,
            buyerName: currentUser.name,
            donorId,
            donorName: listing.donorName,
            createdAt: new Date().toISOString(),
            messages: []
        };
        conversations.push(conversation);
    }

    // Add initial message
    const message = {
        id: Date.now().toString(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        text: `Hi! I'm interested in your "${listing.name}". I need ${quantity} quantity. ${notes ? 'Special instructions: ' + notes : ''}`,
        timestamp: new Date().toISOString(),
        type: 'booking'
    };

    conversation.messages.push(message);
    saveConversationsToStorage();

    // Update listing status if fully booked
    listing.status = 'booked';
    saveListingsToStorage();

    addNotification(`Booking confirmed for "${listing.name}"! 📦`, '✅');
    alert('Booking confirmed! You can now chat with the donor.');
    closeBooking();
    showMessages();
}

// ============ MESSAGING SYSTEM ============
function loadConversations() {
    const stored = localStorage.getItem('conversations');
    if (stored) {
        conversations = JSON.parse(stored);
    }

    const userConversations = conversations.filter(c => 
        c.buyerId === currentUser.id || c.donorId === currentUser.id
    );

    const container = document.getElementById('conversationsList');

    if (userConversations.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">No conversations yet</p>';
        document.getElementById('chatPanel').style.display = 'none';
        return;
    }

    container.innerHTML = userConversations.map(conv => `
        <div class="conversation-item" onclick="openChat('${conv.id}')">
            <div class="conversation-header">
                <strong>${conv.buyerId === currentUser.id ? conv.donorName : conv.buyerName}</strong>
            </div>
            <div class="conversation-preview">
                ${conv.messages.length > 0 ? conv.messages[conv.messages.length - 1].text.substring(0, 50) + '...' : 'No messages yet'}
            </div>
            <div class="conversation-time">
                ${formatTime(conv.messages.length > 0 ? conv.messages[conv.messages.length - 1].timestamp : conv.createdAt)}
            </div>
        </div>
    `).join('');

    updateStats();
}

function openChat(conversationId) {
    selectedConversation = conversations.find(c => c.id === conversationId);
    if (!selectedConversation) return;

    const partnerName = selectedConversation.buyerId === currentUser.id 
        ? selectedConversation.donorName 
        : selectedConversation.buyerName;

    document.getElementById('chatPartnerName').textContent = partnerName;
    document.getElementById('chatPanel').style.display = 'flex';
    renderChatMessages();
    document.getElementById('messageInput').focus();
}

function renderChatMessages() {
    const container = document.getElementById('chatMessages');
    const messages = selectedConversation.messages;

    container.innerHTML = messages.map(msg => `
        <div class="message ${msg.senderId === currentUser.id ? 'sent' : 'received'}">
            <div class="message-content">
                <strong>${msg.senderName}</strong>
                <p>${msg.text}</p>
                <small>${formatTime(msg.timestamp)}</small>
            </div>
        </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
}

function sendMessage() {
    const text = document.getElementById('messageInput').value.trim();
    if (!text || !selectedConversation) return;

    const message = {
        id: Date.now().toString(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        text,
        timestamp: new Date().toISOString(),
        type: 'text'
    };

    selectedConversation.messages.push(message);
    saveConversationsToStorage();
    document.getElementById('messageInput').value = '';
    renderChatMessages();
}

function closeChat() {
    selectedConversation = null;
    document.getElementById('chatPanel').style.display = 'none';
}

// ============ PROFILE & VERIFICATION ============
function updateProfile() {
    const name = document.getElementById('profileEditName').value.trim();
    const email = document.getElementById('profileEditEmail').value.trim();
    const phone = document.getElementById('profileEditPhone').value.trim();
    const bio = document.getElementById('profileEditBio').value.trim();
    const newPassword = document.getElementById('profileNewPassword').value;

    if (!name || !email || !phone) {
        alert('Please fill in required fields');
        return;
    }

    currentUser.name = name;
    currentUser.email = email;
    currentUser.phone = phone;
    currentUser.bio = bio;

    if (newPassword) {
        currentUser.password = newPassword;
    }

    // Update in users list
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
        localStorage.setItem('users', JSON.stringify(users));
    }

    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateProfileDisplay();
    alert('Profile updated successfully!');
}

function verifyEmail() {
    document.getElementById('verifyType').textContent = 'Email';
    document.getElementById('verifyMessage').textContent = `Enter the code sent to ${currentUser.email}`;
    document.getElementById('verificationModal').dataset.type = 'email';
    document.getElementById('verificationCode').value = '';
    document.getElementById('verificationModal').style.display = 'flex';
}

function verifyPhone() {
    document.getElementById('verifyType').textContent = 'Phone';
    document.getElementById('verifyMessage').textContent = `Enter the code sent to ${currentUser.phone}`;
    document.getElementById('verificationModal').dataset.type = 'phone';
    document.getElementById('verificationCode').value = '';
    document.getElementById('verificationModal').style.display = 'flex';
}

function submitVerification() {
    const code = document.getElementById('verificationCode').value.trim();
    const type = document.getElementById('verificationModal').dataset.type;

    if (!code) {
        alert('Please enter the verification code');
        return;
    }

    // Simulate verification (in real app, validate against sent code)
    if (code.length >= 4) {
        if (type === 'email') {
            currentUser.emailVerified = true;
        } else {
            currentUser.phoneVerified = true;
        }

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            localStorage.setItem('users', JSON.stringify(users));
        }

        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateProfileDisplay();
        closeVerification();
        alert(`${type === 'email' ? 'Email' : 'Phone'} verified successfully!`);
    } else {
        alert('Invalid verification code');
    }
}

function closeVerification() {
    document.getElementById('verificationModal').style.display = 'none';
}

// ============ DASHBOARD ============
function updateDashboard() {
    const myListings = listings.filter(l => l.donorId === currentUser.id);
    const myBookings = conversations.filter(c => 
        c.buyerId === currentUser.id && c.messages.length > 0
    );

    document.getElementById('statListings').textContent = myListings.length;
    document.getElementById('statBookings').textContent = myBookings.length;

    const unreadCount = conversations.filter(c =>
        (c.buyerId === currentUser.id || c.donorId === currentUser.id) &&
        c.messages.length > 0
    ).length;
    document.getElementById('statMessages').textContent = unreadCount;

    // Recent activity
    const activity = [];
    if (myListings.length > 0) {
        activity.push(`You have ${myListings.length} active listings`);
    }
    if (myBookings.length > 0) {
        activity.push(`You have ${myBookings.length} active bookings`);
    }
    if (currentUser.emailVerified) {
        activity.push('✅ Email verified');
    }
    if (currentUser.phoneVerified) {
        activity.push('✅ Phone verified');
    }

    const container = document.getElementById('recentActivity');
    container.innerHTML = activity.length > 0
        ? activity.map(a => `<p>• ${a}</p>`).join('')
        : '<p style="color: #999;">No recent activity</p>';
}

function updateStats() {
    updateDashboard();
}

// ============ UTILITY FUNCTIONS ============
function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const base64 = event.target.result;
        document.getElementById('foodPhoto').dataset.base64 = base64;

        const preview = document.getElementById('photoPreview');
        preview.innerHTML = `<img src="${base64}" style="max-width: 100%; border-radius: 4px;">`;
    };
    reader.readAsDataURL(file);
}

function clearForm(type) {
    if (type === 'postFood') {
        document.getElementById('foodName').value = '';
        document.getElementById('foodDescription').value = '';
        document.getElementById('foodQuantity').value = '';
        document.getElementById('foodLocation').value = '';
        document.getElementById('foodPickupTime').value = '';
        document.getElementById('foodPrice').value = '';
        document.getElementById('foodFree').checked = false;
        document.getElementById('foodSafetyCheck').checked = false;
        document.getElementById('foodPhoto').value = '';
        document.getElementById('photoPreview').innerHTML = '';
        delete document.getElementById('foodPhoto').dataset.base64;
    } else if (type === 'register') {
        document.getElementById('regName').value = '';
        document.getElementById('regEmail').value = '';
        document.getElementById('regPassword').value = '';
        document.getElementById('regPhone').value = '';
        document.getElementById('regRole').value = '';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// ============ STORAGE ============
function saveListingsToStorage() {
    localStorage.setItem('listings', JSON.stringify(listings));
}

function saveConversationsToStorage() {
    localStorage.setItem('conversations', JSON.stringify(conversations));
}

function saveFavoritesToStorage() {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function saveReviewsToStorage() {
    localStorage.setItem('reviews', JSON.stringify(reviews));
}

function saveBookingsToStorage() {
    localStorage.setItem('bookings', JSON.stringify(bookings));
}

function saveNotificationsToStorage() {
    localStorage.setItem('notifications', JSON.stringify(notifications));
}

function loadDataFromStorage() {
    const stored = localStorage.getItem('listings');
    if (stored) {
        listings = JSON.parse(stored);
    }

    const convStored = localStorage.getItem('conversations');
    if (convStored) {
        conversations = JSON.parse(convStored);
    }

    const favStored = localStorage.getItem('favorites');
    if (favStored) {
        favorites = JSON.parse(favStored);
    }

    const revStored = localStorage.getItem('reviews');
    if (revStored) {
        reviews = JSON.parse(revStored);
    }

    const bookStored = localStorage.getItem('bookings');
    if (bookStored) {
        bookings = JSON.parse(bookStored);
    }

    const notifStored = localStorage.getItem('notifications');
    if (notifStored) {
        notifications = JSON.parse(notifStored);
    }
}

// Initialize app on page load
window.addEventListener('DOMContentLoaded', init);
