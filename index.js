import cassandra from "cassandra-driver";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import {
  fetchMessagesByRoomId,
  fetchRoomById,
  fetchRoomsByUserReadKeyWithPaging,
  getNumNotRead,
  insertMessageIntoRoom,
  updateRoomIsRead,
  updateRoomIsReadWithLassMessage,
} from "./chatService.js";
import { runKafkaConsumer } from "./kafkaConsumer.js";
import { connectProducer, sendKafkaNotification } from "./kafkaProducer.js";
import { toNotification } from "./utils.js";
dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const JWT_SECRET = process.env.JWT_SECRET;
const allowedOrigins = [
  "http://localhost:8081",
  "http://localhost:3000",
  "http://localhost:3001",
  "https://meal-sync-admin-web.vercel.app",
  "https://meal-sync-web-admin.vercel.app",
];
// Configure CORS
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow request
    } else {
      callback(new Error("Not allowed by CORS")); // Block request
    }
  },
};

app.use(cors(corsOptions)); // Apply CORS middleware
// Configure Cassandra client to connect to the Docker container
const cassandraClient = new cassandra.Client({
  contactPoints: [process.env.CASSANDRA_CONTACT_POINTS],
  localDataCenter: process.env.CASSANDRA_LOCAL_DATA_CENTER,
  keyspace: process.env.CASSANDRA_KEYSPACE,
});
connectProducer();
// Middleware to verify JWT and associate each socket with a user ID
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.token;
  console.log(token);
  if (!token) return next(new Error("Authentication error"));

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error("Authentication error"));
    console.log(decoded);
    socket.userId =
      decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/sid"];
    socket.username =
      decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
    socket.roleId = decoded["roleid"];
    next();
  });
});
runKafkaConsumer(io, cassandraClient).catch(console.error);
// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.userId}`);
  socket.join(socket.userId);

  socket.on("leaveRoom", (data) => {
    const { roomId } = data;
    socket.leave(roomId);
    console.log(`User ${socket.id} left room ${roomId}`);
  });
  // Load previous messages for the room associated with the user
  socket.on("joinRoomsChat", async (msg) => {
    console.log(msg);

    const roomId = msg.chatRoomId;
    const chatData = msg.chatData;
    const data = await fetchRoomById(roomId, cassandraClient);

    console.log(`room data: `, data);
    if (!data) {
      io.to(`${socket.userId}`).emit("checkIsOpen", {
        isOpen: false,
        roomId: roomId,
      });
      return;
    } else {
      if (data[0].is_close == 1) {
        io.to(`${socket.userId}`).emit("checkIsOpen", {
          isOpen: true,
          roomId: roomId,
        });
      } else {
        console.log("room is open");
        io.to(`${socket.userId}`).emit("checkIsOpen", {
          isOpen: false,
          roomId: roomId,
        });
      }
    }
    socket.join(`chatRoom_${roomId}`);

    const dataMessage = await fetchMessagesByRoomId(roomId, cassandraClient);
    await updateRoomIsRead(roomId, [Number(socket.userId)], cassandraClient);
    console.log(dataMessage, " data message");
    console.log(roomId, " room id in previos message");
    const data2 = await getNumNotRead(socket.userId, cassandraClient);
    io.to(`${socket.userId}`).emit("getCountNotRead", data2);
    io.to(`chatRoom_${roomId}`).emit("previousMessages", dataMessage);
  });

  socket.on("regisListChannel", async (msg) => {
    console.log(msg, " regis data");
    if (msg) {
      const data = await fetchRoomsByUserReadKeyWithPaging(
        cassandraClient,
        socket.userId,
        msg.pageState,
        msg.pageSize
      );
      if (data) {
        console.log(data, " daaaaaaaaaataaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        io.to(socket.userId).emit("getListChannel", data);
      }
    }
  });

  socket.on("regisGetNotRead", async (msg) => {
    console.log("regisGetNotRead");
    if (msg) {
      const data = await getNumNotRead(socket.userId, cassandraClient);
      console.log(data, " not readdddddddddddddddddddddd");
      io.to(socket.userId).emit("getCountNotRead", data);
    }
  });
  socket.on("leaveRoomsChat", async (msg) => {
    try {
      const { chatRoomId } = msg; // Extract chatRoomId from the message

      if (!chatRoomId) {
        console.error("chatRoomId is missing in the message.");
        return;
      }

      const roomId = `chatRoom_${chatRoomId}`; // Format room name consistently

      // Make the socket leave the specified room
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left room: ${roomId}`);

      // Optionally notify other members in the room that this user has left
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  });
  socket.on("getRoomDataById", async (msg) => {
    try {
      const data = await fetchRoomById(msg, cassandraClient);
      if (data && Array.isArray(data) && data.length > 0) {
        io.to(`${socket.userId}`).emit("receivedRoomData", data[0]);
      }
    } catch (error) {
      console.error("Error fetching room data:", error);
    }
  });
  // Handle receiving a new chat message
  socket.on("chatMessage", async (msg) => {
    const messageId = cassandra.types.Uuid.random();
    const timestamp = new Date();
    console.log(msg, " message ne ");
    const roleId = Number(socket.roleId);
    console.log(roleId, " role idddd----------------ddddddddddddddddddd");
    if (msg) {
      console.log(msg, "message to send check");
      try {
        const roomId = String(msg.chatRoomId);

        console.log(roomId, " chat room id");

        const listRoomData = await fetchRoomById(roomId, cassandraClient);
        if (
          listRoomData &&
          Array.isArray(listRoomData) &&
          listRoomData.length > 0
        ) {
          const roomData = listRoomData[0];
          if (roomData.is_close == 1) {
          } else {
            io.to(`${socket.userId}`).emit(
              "errorChat",
              "Phòng nhắn tín đã đóng! Bạn chỉ có thể xem lại lịch sử chat."
            );
            return;
          }

          const result = await insertMessageIntoRoom(
            msg,
            roleId,
            socket.userId,
            cassandraClient
          );

          io.to(`chatRoom_${roomId}`).emit("chatMessage", result);
          if (result) {
            const mapUpdateIds = roomData.list_user_id.reduce((acc, userId) => {
              if (userId == socket.userId) {
                return acc;
              } else {
                return [...acc, userId];
              }
            }, []);

            await updateRoomIsReadWithLassMessage(
              roomId,
              mapUpdateIds,
              msg.text,
              cassandraClient,
              socket.userId
            );
            for (const mapUpdateId of mapUpdateIds) {
              const data = await fetchRoomById(roomId, cassandraClient);
              await sendKafkaNotification(
                socket.userId,
                mapUpdateId,
                msg.text,
                roomId
              );
              console.log(mapUpdateId, "map update");
              const notification = toNotification(
                msg.text,
                roomId,
                "Tin nhắn từ " + msg.fullName,
                msg.avatarUrl,
                6
              );
              io.to(`${mapUpdateId}`).emit("notification", notification);
              if (data && Array.isArray(data) && data.length > 0) {
                io.to(`${mapUpdateId}`).emit("getNewMessage", data[0]);
                const data2 = await getNumNotRead(mapUpdateId, cassandraClient);
                console.log(data2, " count not read");
                io.to(`${mapUpdateId}`).emit("getCountNotRead", data2);
              }
            }
          } else {
            console.error("Room not found " + roomData);
            return;
          }
          /*  const notification = {
            AccountId: socket.userId,
            content: msg.text,
          };
          console.log(notification, " notification");
          // Send notification to other users
          io.emit("notification222222", notification);
          // Send notification to specific user via Socket.IO
          io.to(msg.chatRoomId).emit("notification", notification);
          // Emit a message to the room creator */
        }
      } catch (e) {
        console.error("Error inserting message", e);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});

app.get("/asdfdsa", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Start server
server.listen(3000, () => {
  console.log("Server is listening on port 3000");
});

/* {
  "Id": 1131,
  "AccountId": 2,
  "ReferenceId": 361,
  "ImageUrl": "https://mealsync.s3.ap-southeast-1.amazonaws.com/image/1732223629482-5bc18658-2305-4f5f-a45b-e8deb962c3c8.jpg",
  "Title": "Đơn hàng",
  "Content": "Đơn hàng MS-361 đã bị hủy bởi khách hàng",
  "Data": {
    "Id": 361,
    "PromotionId": 0,
    "ShopId": 2,
    "CustomerId": 3,
    "DeliveryPackageId": null,
    "ShopLocationId": 775,
    "CustomerLocationId": 774,
    "BuildingId": 1,
    "BuildingName": "Tòa A1 - Ký túc xá Khu A - Đại học Quốc gia TP.HCM",
    "Status": 4,
    "Note": "",
    "ShippingFee": 0.0,
    "TotalPrice": 30000.0,
    "TotalPromotion": 0.0,
    "ChargeFee": 3000.0,
    "FullName": "Cao Nhật Thiên",
    "PhoneNumber": "0868363802",
    "Address": null,
    "Latitude": 0.0,
    "Longitude": 0.0,
    "OrderDate": "2024-11-20T05:40:33.759574+00:00",
    "IntendedReceiveAt": "0001-01-01T00:00:00+00:00",
    "ReceiveAt": null,
    "CompletedAt": null,
    "StartTime": 1800,
    "EndTime": 1830,
    "QrScanToDeliveried": null,
    "DeliverySuccessImageUrl": null,
    "IsRefund": false,
    "IsReport": false,
    "Reason": null
  },
  "EntityType": 1,
  "Type": 2,
  "IsSave": true,
  "IsRead": false,
  "CreatedBy": 15,
  "CreatedDate": "2024-11-23T15:08:48.3902038+00:00",
  "UpdatedBy": 15,
  "UpdatedDate": "2024-11-23T15:08:48.3902038+00:00"
} */
