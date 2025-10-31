const API_URL = '/api';

// Check authentication on page load
async function checkAuth() {
    try {
        const response = await fetch(`${API_URL}/auth/status`, {
            credentials: 'include'
        });
        const data = await response.json();
        if (!data.authenticated) {
            window.location.href = '/';
        } else {
            document.getElementById('usernameDisplay').textContent = data.username;
        }
    } catch (error) {
        console.error('Fehler:', error);
        window.location.href = '/';
    }
}

// Logout function
async function logout() {
    try {
        await fetch(`${API_URL}/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        window.location.href = '/';
    } catch (error) {
        console.error('Fehler:', error);
        alert('Fehler beim Abmelden');
    }
}

// Load data from database
async function loadData() {
    try {
        const response = await fetch(`${API_URL}/cats`, {
            credentials: 'include'
        });
        if (response.status === 401) {
            window.location.href = '/';
            return { cats: [] };
        }
        if (!response.ok) throw new Error('Fehler beim Laden der Daten');
        return await response.json();
    } catch (error) {
        console.error('Fehler:', error);
        alert('Fehler beim Laden der Daten. Bitte stellen Sie sicher, dass der Server läuft.');
        return { cats: [] };
    }
}

// Save data is now handled by individual API calls
function saveData(data) {
    // No longer needed - using API calls instead
}

// Add a new cat
async function addCat() {
    const input = document.getElementById('catNameInput');
    const name = input.value.trim();
    
    if (!name) {
        alert('Bitte geben Sie einen Katzennamen ein!');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name })
        });

        if (!response.ok) {
            const error = await response.json();
            alert(error.error || 'Fehler beim Hinzufügen der Katze');
            return;
        }

        input.value = '';
        await renderCats();
    } catch (error) {
        console.error('Fehler:', error);
        alert('Fehler beim Hinzufügen der Katze');
    }
}

// Delete a cat
async function deleteCat(id) {
    if (!confirm('Sind Sie sicher, dass Sie diese Katze und alle Fütterungseinträge löschen möchten?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cats/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Fehler beim Löschen');

        await renderCats();
    } catch (error) {
        console.error('Fehler:', error);
        alert('Fehler beim Löschen der Katze');
    }
}

// Add feeding record
async function addFeeding(catId) {
    const input = document.getElementById(`amount-${catId}`);
    const amount = input.value.trim();

    if (!amount) {
        alert('Bitte geben Sie die Futtermenge ein!');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/feedings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ 
                cat_id: catId, 
                amount,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) throw new Error('Fehler beim Hinzufügen der Fütterung');

        input.value = '';
        await renderCats();
    } catch (error) {
        console.error('Fehler:', error);
        alert('Fehler beim Hinzufügen der Fütterung');
    }
}

// Delete feeding record
async function deleteFeeding(catId, feedingId) {
    try {
        const response = await fetch(`${API_URL}/feedings/${feedingId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Fehler beim Löschen');

        await renderCats();
    } catch (error) {
        console.error('Fehler:', error);
        alert('Fehler beim Löschen der Fütterung');
    }
}

// Format timestamp
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('de-DE', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Calculate stats
function calculateStats(feedings) {
    const today = new Date().setHours(0, 0, 0, 0);
    const todayFeedings = feedings.filter(f => 
        new Date(f.timestamp).setHours(0, 0, 0, 0) === today
    );

    return {
        total: feedings.length,
        today: todayFeedings.length
    };
}

// Render all cats
async function renderCats() {
    const data = await loadData();
    const container = document.getElementById('catsList');

    if (data.cats.length === 0) {
        container.innerHTML = '<div class="no-data">Noch keine Katzen hinzugefügt. Fügen Sie oben Ihre erste Katze hinzu!</div>';
        return;
    }

    container.innerHTML = data.cats.map(cat => {
        const stats = calculateStats(cat.feedings);
        const sortedFeedings = [...cat.feedings].sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );

        return `
            <div class="cat-card">
                <div class="cat-header">
                    <div class="cat-name">${cat.name}${cat.name.toLowerCase() === 'lilly' ? ' ❤️' : ''}${cat.name.toLowerCase() === 'mimi' ? ' ❤️❤️🐱' : ''}</div>
                    <button class="delete-btn" onclick="deleteCat(${cat.id})">Löschen</button>
                </div>

                <div class="stats">
                    <div class="stat">
                        <div class="stat-value">${stats.today}</div>
                        <div class="stat-label">Heute gefüttert</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${stats.total}</div>
                        <div class="stat-label">Gesamt Fütterungen</div>
                    </div>
                </div>

                <div class="feeding-section">
                    <div class="feeding-controls">
                        <input type="text" id="amount-${cat.id}" placeholder="Menge (z.B. 1 Tasse, 50g)" />
                        <button class="feed-btn" onclick="addFeeding(${cat.id})">Fütterung eintragen</button>
                    </div>

                    <div class="feeding-history">
                        ${sortedFeedings.length === 0 ? 
                            '<div class="no-data">Noch keine Fütterungseinträge</div>' :
                            sortedFeedings.map(feeding => `
                                <div class="feeding-entry">
                                    <div>
                                        <span class="feeding-amount">${feeding.amount}</span>
                                        <div class="feeding-time">${formatTimestamp(feeding.timestamp)}</div>
                                    </div>
                                    <button class="delete-feeding" onclick="deleteFeeding(${cat.id}, ${feeding.id})">×</button>
                                </div>
                            `).join('')
                        }
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Load can purchases
async function loadCanPurchases() {
    try {
        const response = await fetch(`${API_URL}/can-purchases`, {
            credentials: 'include'
        });
        if (response.status === 401) {
            window.location.href = '/';
            return { purchases: [] };
        }
        if (!response.ok) throw new Error('Fehler beim Laden der Dosenkäufe');
        return await response.json();
    } catch (error) {
        console.error('Fehler:', error);
        return { purchases: [] };
    }
}

// Add a can purchase
async function addCanPurchase() {
    const quantityInput = document.getElementById('canQuantityInput');
    const notesInput = document.getElementById('canNotesInput');
    const quantity = parseInt(quantityInput.value);
    const notes = notesInput.value.trim();
    
    if (!quantity || quantity <= 0) {
        alert('Bitte geben Sie eine gültige Anzahl Dosen ein!');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/can-purchases`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ 
                quantity,
                notes: notes || null
            })
        });

        if (!response.ok) {
            const error = await response.json();
            alert(error.error || 'Fehler beim Hinzufügen des Dosenkaufs');
            return;
        }

        quantityInput.value = '';
        notesInput.value = '';
        await renderCanPurchases();
    } catch (error) {
        console.error('Fehler:', error);
        alert('Fehler beim Hinzufügen des Dosenkaufs');
    }
}

// Delete a can purchase
async function deleteCanPurchase(id) {
    if (!confirm('Sind Sie sicher, dass Sie diesen Dosenkauf löschen möchten?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/can-purchases/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Fehler beim Löschen');

        await renderCanPurchases();
    } catch (error) {
        console.error('Fehler:', error);
        alert('Fehler beim Löschen des Dosenkaufs');
    }
}

// Render can purchases
async function renderCanPurchases() {
    const data = await loadCanPurchases();
    const container = document.getElementById('canPurchasesList');

    if (!data.purchases || data.purchases.length === 0) {
        container.innerHTML = '';
        return;
    }

    const totalCans = data.purchases.reduce((sum, purchase) => sum + purchase.quantity, 0);

    container.innerHTML = `
        <div class="can-purchases-card">
            <div class="can-purchases-header">
                <h3>📦 Dosenkäufe</h3>
                <div class="total-cans">Gesamt gekauft: <strong>${totalCans} Dosen</strong></div>
            </div>
            <div class="purchases-list">
                ${data.purchases.map(purchase => `
                    <div class="purchase-entry">
                        <div class="purchase-info">
                            <span class="purchase-quantity">${purchase.quantity} Dosen</span>
                            ${purchase.notes ? `<span class="purchase-notes">${purchase.notes}</span>` : ''}
                            <div class="purchase-date">${formatTimestamp(purchase.purchase_date)}</div>
                        </div>
                        <button class="delete-purchase" onclick="deleteCanPurchase(${purchase.id})">×</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Add event listener for Enter key
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    document.getElementById('catNameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addCat();
    });
    document.getElementById('canQuantityInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addCanPurchase();
    });
    document.getElementById('canNotesInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addCanPurchase();
    });
    renderCats();
    renderCanPurchases();
});