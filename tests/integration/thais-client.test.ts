/**
 * Tests du client API Thaïs
 */

import { thaisClient } from '../../src/thais/thais.client.js';

async function runTests(): Promise<void> {
    console.log('🧪 TESTS CLIENT API THAÏS\n');

    // Test 1: Connexion
    console.log('📋 Test 1: Connexion');
    const connected = await thaisClient.testConnection();
    console.log(connected ? '   ✅ OK\n' : '   ❌ ÉCHEC\n');

    // Test 2: Types de chambres
    console.log('📋 Test 2: Types de chambres');
    const roomTypes = await thaisClient.getRoomTypes();
    console.log(`   ✅ ${roomTypes.length} types trouvés\n`);

    // Test 3: Disponibilités
    console.log('📋 Test 3: Disponibilités');
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 14);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 3);

    const availabilities = await thaisClient.getAvailability({
        checkIn: checkIn.toISOString().slice(0, 10),
        checkOut: checkOut.toISOString().slice(0, 10),
        adults: 2,
    });
    console.log(`   ✅ ${availabilities.length} chambre(s) disponible(s)\n`);

    console.log('✅ Tous les tests passés !');
}

runTests().catch(console.error);