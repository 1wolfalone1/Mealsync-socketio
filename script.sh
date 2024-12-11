kafka-topics.sh --create --topic request-notification --bootstrap-server kafka-service:9092 --partitions 3 --replication-factor 1

kafka-console-consumer.sh --bootstrap-server kafka-service:9092 --topic joinRoom --from-beginning