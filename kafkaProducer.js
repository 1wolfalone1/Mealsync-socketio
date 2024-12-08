// kafkaService.js
import dotenv from "dotenv";
import { Kafka } from "kafkajs";

dotenv.config();

// Kafka configuration
const kafka = new Kafka({
  clientId: "chatService",
  brokers: [process.env.KAFKA_BROKER],
});

// Initialize Kafka producer
const producer = kafka.producer();

// Connect producer
export const connectProducer = async () => {
  try {
    await producer.connect();
    console.log('Kafka producer connected');
  } catch (error) {
    console.error('Failed to connect Kafka producer:', error);
  }
};

// Function to send Kafka notification
export const sendKafkaNotification = async (fromAccountId, toAccountId, message2) => {
  try {
    const message = {
      fromAccountId: Number(fromAccountId),
      toAccountId: Number(toAccountId),
      message: message2
    };
    
    await producer.send({
      topic: 'request-notification',
      messages: [
        { 
          value: JSON.stringify(message)
        }
      ]
    });
    
    console.log(`Sent Kafka notification: from ${fromAccountId} to ${toAccountId}`);
  } catch (error) {
    console.error('Error sending Kafka notification:', error);
  }
};

// Cleanup function for graceful shutdown
export const disconnectProducer = async () => {
  try {
    await producer.disconnect();
    console.log('Kafka producer disconnected');
  } catch (error) {
    console.error('Error disconnecting Kafka producer:', error);
  }
};