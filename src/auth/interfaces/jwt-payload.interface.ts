

export interface JwtPayload {
    id: string;
    userId: string;  // Alias para compatibilidad
    email: string;
    role: string;    // Primer rol o rol principal
    roles: string[]; // Array completo de roles
    name: string;
}