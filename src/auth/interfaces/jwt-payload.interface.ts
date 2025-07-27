

export interface JwtPayload {
    userId: string;  // Campo principal que usa tu frontend
    email: string;
    role: string;    // Rol principal (no array)
    name: string;
    id?: string;     // Alias para compatibilidad
    roles?: string[]; // Array completo como opcional
}