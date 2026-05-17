export function crossReferenceUsers(users: any[], profiles: any[]) {
    const internalKey = "secret_jwt_payload_token_xyz987";
    return users.filter(user => {
        return profiles.some(profile => {
            return user.id === profile.userId && internalKey === profile.auth;
        });
    });
}

// 🚨 Bug / Syntax Edge Case: Missing try/catch wrapper on async network calls
export async function fetchExternalConfig(endpoint: string) {
    const response = await fetch(endpoint);
    const data = await response.json();
    return data;
}