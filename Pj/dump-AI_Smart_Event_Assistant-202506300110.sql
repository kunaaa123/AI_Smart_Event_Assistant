-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: localhost    Database: AI_Smart_Event_Assistant
-- ------------------------------------------------------
-- Server version	9.3.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comments` (
  `comment_id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `user_id` int NOT NULL,
  `comment` varchar(200) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`comment_id`),
  KEY `event_id` (`event_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE CASCADE,
  CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comments`
--

LOCK TABLES `comments` WRITE;
/*!40000 ALTER TABLE `comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `event_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` varchar(200) DEFAULT NULL,
  `organizer_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `event_image` varchar(512) DEFAULT NULL,
  PRIMARY KEY (`event_id`),
  KEY `organizer_id` (`organizer_id`),
  CONSTRAINT `events_ibfk_1` FOREIGN KEY (`organizer_id`) REFERENCES `organizers` (`organizer_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
INSERT INTO `events` VALUES (11,'งานเลี้ยงรุ่น','งานเลี้ยงรุ่นประจำปี 2025',1,'2025-06-26 17:03:00','https://yourdomain.com/image.jpg');
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favorites`
--

DROP TABLE IF EXISTS `favorites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favorites` (
  `favorite_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `event_id` int NOT NULL,
  PRIMARY KEY (`favorite_id`),
  KEY `user_id` (`user_id`),
  KEY `event_id` (`event_id`),
  CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favorites`
--

LOCK TABLES `favorites` WRITE;
/*!40000 ALTER TABLE `favorites` DISABLE KEYS */;
/*!40000 ALTER TABLE `favorites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `matchings`
--

DROP TABLE IF EXISTS `matchings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `matchings` (
  `match_id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `organizer_id` int NOT NULL,
  `matched_by_ai` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`match_id`),
  KEY `event_id` (`event_id`),
  KEY `organizer_id` (`organizer_id`),
  CONSTRAINT `matchings_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE CASCADE,
  CONSTRAINT `matchings_ibfk_2` FOREIGN KEY (`organizer_id`) REFERENCES `organizers` (`organizer_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `matchings`
--

LOCK TABLES `matchings` WRITE;
/*!40000 ALTER TABLE `matchings` DISABLE KEYS */;
/*!40000 ALTER TABLE `matchings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organizer_portfolios`
--

DROP TABLE IF EXISTS `organizer_portfolios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organizer_portfolios` (
  `portfolio_id` int NOT NULL AUTO_INCREMENT,
  `organizer_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `image_url` varchar(255) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `price` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`portfolio_id`),
  KEY `organizer_id` (`organizer_id`),
  CONSTRAINT `organizer_portfolios_ibfk_1` FOREIGN KEY (`organizer_id`) REFERENCES `organizers` (`organizer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organizer_portfolios`
--

LOCK TABLES `organizer_portfolios` WRITE;
/*!40000 ALTER TABLE `organizer_portfolios` DISABLE KEYS */;
INSERT INTO `organizer_portfolios` VALUES (2,1,'งานแต่งสุดหรู','รับจัดงานแต่งงานครบวงจร พร้อมทีมงานมืออาชีพ','https://your-image-url.com/wedding.jpg','งานแต่งงาน','50000','2025-06-27 17:15:52'),(4,6,'','งานเลี้ยงรุ่นประจำปี 2025','','','','2025-06-27 18:33:09');
/*!40000 ALTER TABLE `organizer_portfolios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organizers`
--

DROP TABLE IF EXISTS `organizers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organizers` (
  `organizer_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `portfolio_img` varchar(50) DEFAULT NULL,
  `expertise` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`organizer_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `organizers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organizers`
--

LOCK TABLES `organizers` WRITE;
/*!40000 ALTER TABLE `organizers` DISABLE KEYS */;
INSERT INTO `organizers` VALUES (1,2,NULL,'จัดงานเลี้ยง งานแต่ง งานสัมมนา','2025-06-26 16:46:47'),(5,6,NULL,'งานแต่งงาน','2025-06-27 17:39:47'),(6,5,NULL,'งานแต่งงาน','2025-06-27 18:31:24');
/*!40000 ALTER TABLE `organizers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `request_organizers`
--

DROP TABLE IF EXISTS `request_organizers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `request_organizers` (
  `request_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `organizer_name` varchar(100) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `price` varchar(50) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `description` text,
  `image_label` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`request_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `request_organizers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `request_organizers`
--

LOCK TABLES `request_organizers` WRITE;
/*!40000 ALTER TABLE `request_organizers` DISABLE KEYS */;
INSERT INTO `request_organizers` VALUES (1,6,'สิง','ตลก','g@g','2000','300','กฟไกไก','','2025-06-26 15:35:23'),(2,2,'dd','10','d651463004@crru.ac.th','2000','0000000','่่่่ร','','2025-06-26 15:51:25');
/*!40000 ALTER TABLE `request_organizers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `first_name` varchar(100) DEFAULT '',
  `last_name` varchar(100) DEFAULT '',
  `email` varchar(50) NOT NULL,
  `phone` varchar(30) DEFAULT '',
  `password` varchar(255) NOT NULL,
  `role` enum('member','organizer','admin') NOT NULL DEFAULT 'member',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `profile_image` varchar(30) DEFAULT NULL,
  `bio` text,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'testuser','','','testuser@example.com','','12345678','member','2025-06-25 18:08:20',NULL,NULL),(2,'dwadaee','ddก','ddก','d651463004@crru.ac.th','0000000','11111','organizer','2025-06-25 18:45:11',NULL,'5141'),(3,'กฟไ','','','d651a463004@crru.ac.th','','11111','member','2025-06-25 19:07:54',NULL,NULL),(4,'sing','ddd','d','sing@g','6','1','member','2025-06-26 07:51:10',NULL,''),(5,'sifng','สมชาย','ใจดี','sfing@g','0999999999','1234','organizer','2025-06-26 13:02:00',NULL,'ทดสอบ'),(6,'กสส','สิง','หา','g@g','300','2','organizer','2025-06-26 13:04:37',NULL,'หล่อ');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'AI_Smart_Event_Assistant'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-30  1:10:56
