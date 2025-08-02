import { NextRequest } from 'next/server';
import { addClient, removeClient, sendUpdate } from '@/lib/stream-utils';

export async function GET(request: NextRequest) {
  const clientId = Math.random().toString(36).substring(7);
  
  const stream = new ReadableStream({
    start(controller) {
      // Add client to the list
      addClient({ id: clientId, controller });
      
      // Send initial data
      sendUpdate(controller);
      
      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`data: {"type":"heartbeat"}\n\n`);
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);
      
      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        removeClient(clientId);
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // Connection already closed
        }
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}