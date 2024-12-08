import dotenv from "dotenv";
import { Kafka } from "kafkajs";

dotenv.config();
// Kafka configuration
const kafka = new Kafka({
  clientId: "notificationService",
  brokers: [process.env.KAFKA_BROKER], // Replace with your Kafka brokers
});

// Consumer setup
const consumer = kafka.consumer({ groupId: "notificationGroup" });

export async function runKafkaConsumer(io) {
  // Connect the consumer
  await consumer.connect();
  await consumer.subscribe({ topic: "notifications2", fromBeginning: false });
  console.log("consumer connected");
  // Listen for messages
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const notification = JSON.parse(message.value.toString());
        const { AccountId, content } = notification;
        console.log("received notification", message.value.toString())
        console.log(`Received notification for user 3 ${notification.AccountId}`);
        // Send message to specific user via Socket.IO
        io.to(`${notification.AccountId}`).emit("notification", notification);
      } catch (err) {
        console.error("Error consuming message", err);
      }
    },

  });
}

