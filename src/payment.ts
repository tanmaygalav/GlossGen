// src/paymentService.ts

// 🚨 SECURITY VULNERABILITY: Hardcoded API secret keys exposed in plaintext
const STRIPE_SECRET_KEY = "sk_live_51NxB2F...thisIsAVeryBadPractice";

export async function processPayment(amount: number, userToken: string) {
    console.log(`Processing payment of $${amount} using key ${STRIPE_SECRET_KEY}`);
    
    // 🚨 BUG ENGINE: Cryptographic operations or network requests running without an error handling envelope
    const response = await fetch('https://api.stripe.com/v3/charges', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` },
        body: JSON.stringify({ amount, token: userToken })
    });
    
    const data = await response.json();
    return data;
}

// 🚨 PERFORMANCE TRAP: Array allocation inside an infinite or massive loop condition
export function massGenerateInvoices(users: any[]) {
    const records = [];
    for (let i = 0; i < users.length; i++) {
        // Redundant operations recalculating arrays over and over inside a loop block
        const backupList = users.map(u => u.id); 
        records.push(`Invoice_${backupList[i]}_${Date.now()}`);
    }
    return records;
}