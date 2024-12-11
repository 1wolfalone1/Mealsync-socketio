import dotenv from "dotenv";
import { Kafka } from "kafkajs";
import { closeChannel, fetchRoomById, insertRoomData } from "./chatService.js";

dotenv.config();
// Kafka configuration
const kafka = new Kafka({
  clientId: "notificationService",
  brokers: [process.env.KAFKA_BROKER], // Replace with your Kafka brokers
});

// Consumer setup
const consumer = kafka.consumer({ groupId: "notificationGroup" });
const joinRoomConsumer = kafka.consumer({ groupId: "roomGroup" });
export async function runKafkaConsumer(io, cassandraClient) {
  // Connect the consumer
  await consumer.connect();
  await consumer.subscribe({ topic: "notifications2", fromBeginning: false });
  await joinRoomConsumer.connect();
  await joinRoomConsumer.subscribe({ topic: "joinRoom", fromBeginning: false });
  console.log("consumer connected");
  // Listen for messages
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const notification = JSON.parse(message.value.toString());
        const { AccountId, content } = notification;
        console.log("received notification", message.value.toString());
        console.log(
          `Received notification for user 3 ${notification.AccountId}`
        );
        // Send message to specific user via Socket.IO
        io.to(`${notification.AccountId}`).emit("notification", notification);
      } catch (err) {
        console.error("Error consuming message", err);
      }
    },
  });
  await joinRoomConsumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const roomData = JSON.parse(message.value.toString());
        const { RoomId, IsOpen, UserId, Notification } = roomData;
        console.log("Received joinRoom message", message.value.toString());
        console.log(`Room ID: ${RoomId}, Is Open: ${IsOpen}`);
        // Additional processing for joinRoom messages can be added here

        const data = await fetchRoomById(RoomId, cassandraClient);
        console.log(data);
        if (!IsOpen) {
          if (data) {
            closeChannel(RoomId, cassandraClient);
          }
        } else {
          await insertRoomData(RoomId, cassandraClient, UserId, data);
        }
        if (Notification) {
          io.to(`${UserId}`).emit("notification", Notification);
        }
      } catch (err) {
        console.error("Error consuming joinRoom message", err);
      }
    },
  });
}
