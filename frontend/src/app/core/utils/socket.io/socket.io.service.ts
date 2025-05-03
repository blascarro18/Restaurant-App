import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from 'environments/environment';
import { AuthService } from 'app/core/auth/auth.service';

@Injectable({
    providedIn: 'root',
})
export class SocketService {
    private socket!: Socket;
    private readonly _authService: AuthService = new AuthService(); // Instancia del servicio de usuario

    constructor() {}

    connect(): void {
        if (this.socket) {
            console.warn('Socket ya está conectado.');
            return;
        }

        const token = this._authService.accessToken; // Obtener el token de acceso del servicio de autenticación

        this.socket = io(environment.socketUrl, {
            path: '/socket.io/',
            secure: true, // Usar WSS
            reconnection: true,
            reconnectionAttempts: 1000,
            reconnectionDelay: 3000, // Espera 3 segundos entre intentos
            transports: ['polling', 'websocket'],
            extraHeaders: {
                Authorization: `Bearer ${token}`, // Enviamos el Bearer token en los encabezados
            },
        });

        this.socket.on('connect', () => {
            console.log(`Conectado al WebSocket: ${this.socket.id}`);
        });

        this.socket.on('disconnect', (reason) => {
            console.warn(`Desconectado del WebSocket: ${reason}`);
        });

        this.socket.on('connect_error', (error) => {
            console.error('Error de conexión:', error);
        });
    }

    /**
     * Escuchar cambios en el estado de una orden
     * @param callback Función a ejecutar cuando cambia el estado de una orden
     */
    listenForOrderStatusChanges(callback: (data: any) => void): void {
        if (!this.socket) {
            console.warn('Socket no está conectado.');
            return;
        }

        this.socket.on('order:updated', callback);
    }

    /**
     * Desconectar el socket manualmente
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            console.log('Socket desconectado.');
            this.socket = undefined!;
        }
    }
}
