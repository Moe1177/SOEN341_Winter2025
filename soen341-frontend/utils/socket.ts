import { Client, IFrame, IMessage, StompSubscription } from '@stomp/stompjs';

let stompClient: Client | null = null;
const subscriptions: Map<string, StompSubscription> = new Map();

export const initStompClient = (): Client => {
  if (stompClient?.active) {
    return stompClient;
  }

  stompClient = new Client({
    brokerURL: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`,
    connectHeaders: {},
    debug: process.env.NODE_ENV === 'development' ? console.log : () => {},
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  stompClient.onConnect = () => {
    console.log('Connected to STOMP WebSocket');
  };

  stompClient.onStompError = (frame: IFrame) => {
    console.error('STOMP error', frame.headers, frame.body);
  };

  stompClient.activate();
  
  return stompClient;
};

export const getStompClient = (): Client => {
  if (!stompClient || !stompClient.active) {
    return initStompClient();
  }
  return stompClient;
};

export const disconnectStompClient = (): void => {
  subscriptions.forEach((subscription) => {
    subscription.unsubscribe();
  });
  subscriptions.clear();
  
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
};

export const subscribe = (destination: string, callback: (message: IMessage) => void): void => {
  const client = getStompClient();
  
  // Unsubscribe if already subscribed to avoid duplicates
  if (subscriptions.has(destination)) {
    subscriptions.get(destination)?.unsubscribe();
    subscriptions.delete(destination);
  }
  
  // Create new subscription
  const subscription = client.subscribe(destination, callback);
  subscriptions.set(destination, subscription);
};

export const unsubscribe = (destination: string): void => {
  if (subscriptions.has(destination)) {
    subscriptions.get(destination)?.unsubscribe();
    subscriptions.delete(destination);
  }
};

export const sendMessage = (destination: string, body: any, headers: Record<string, string> = {}): void => {
  const client = getStompClient();
  client.publish({
    destination,
    body: JSON.stringify(body),
    headers
  });
};
