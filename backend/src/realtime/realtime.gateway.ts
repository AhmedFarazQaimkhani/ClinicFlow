import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

export type ClinicEvent =
  | 'token.created'
  | 'token.called'
  | 'token.started'
  | 'token.completed'
  | 'prescription.created'
  | 'prescription.ready'
  | 'dispensing.created'
  | 'dispensing.completed'
  | 'payment.completed'
  | 'repeat.requested'
  | 'repeat.approved';

@Injectable()
@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(private readonly jwt: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ||
        (typeof client.handshake.headers.authorization === 'string'
          ? client.handshake.headers.authorization.replace('Bearer ', '')
          : undefined);
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        clinicId: string;
      }>(token, { secret: process.env.JWT_ACCESS_SECRET });
      const room = `clinic:${payload.clinicId}`;
      await client.join(room);
      client.data.clinicId = payload.clinicId;
      client.data.userId = payload.sub;
    } catch {
      this.logger.warn('Realtime connection rejected');
      client.disconnect();
    }
  }

  @SubscribeMessage('ping')
  ping(@ConnectedSocket() client: Socket, @MessageBody() _body: unknown) {
    client.emit('pong', { ok: true });
  }

  emitClinic(clinicId: string, event: ClinicEvent, payload: unknown) {
    try {
      this.server?.to(`clinic:${clinicId}`).emit(event, payload);
    } catch {
      this.logger.warn(`Could not emit ${event}`);
    }
  }
}
