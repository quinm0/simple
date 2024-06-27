import type { Job } from 'bullmq';

type Handler<T> = (job: Job<T>) => Promise<void>;

// Runtime to register handlers
export class JobRuntime<T extends { type: string }> {
  private handlers: Record<T['type'], Handler<any>> = {} as Record<T['type'], Handler<any>>;

  registerHandler<K extends T['type']>(type: K, handler: Handler<Extract<T, { type: K }>>) {
    this.handlers[type] = handler;
  }

  getHandler<K extends T['type']>(type: K): Handler<Extract<T, { type: K }>> | undefined {
    return this.handlers[type] as Handler<Extract<T, { type: K }>> | undefined;
  }
}
