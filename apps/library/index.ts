import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { env } from './env';
import type { MyJobData } from 'types';

const QUEUE_NAME = 'library-queue';

// Redis connection configuration
const connection = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
});

// Create a BullMQ queue with the job data type
const myQueue = new Queue<MyJobData>(QUEUE_NAME, { connection });

// Producer: Adding a job to the queue
async function addJob() {
  await myQueue.add('my-job', { foo: 'bar' });
  console.log('Job added to the queue');
}

// Consumer: Processing jobs from the queue
const worker = new Worker<MyJobData>(QUEUE_NAME, async (job: Job<MyJobData>) => {
  console.log(`Processing job ${job.id} with data:`, job.data);
}, { connection });

// Add a job to the queue when the server starts
addJob();

// Simple HTTP server to keep the container running
import http from 'http';
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Media server is running\n');
});

server.listen(3000, () => {
  console.log('Server is listening on port 3000');
});

// server on close 
server.on('close', () => {
  console.log('Server is closing');
  worker.close();
  connection.quit();
  console.log('Server is closed');
});
