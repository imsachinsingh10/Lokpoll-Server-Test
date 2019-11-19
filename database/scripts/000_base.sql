-- -----------------------------------------------------
-- Schema lokpoll
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `lokpoll` ;
CREATE SCHEMA IF NOT EXISTS `lokpoll` DEFAULT CHARACTER SET utf8 ;
USE `lokpoll` ;

-- -----------------------------------------------------
-- Table `user_role`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `user_role`;
CREATE TABLE `user_role` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
);

-- -----------------------------------------------------
-- Table `db_logs`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `db_logs` ;
CREATE TABLE `db_logs` (
  `id` bigint(200) NOT NULL AUTO_INCREMENT,
  `dev` varchar(200) DEFAULT NULL,
  `date` datetime DEFAULT current_timestamp(),
  `scriptName` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
);

-- -----------------------------------------------------
-- Table `user`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `user` ;
CREATE TABLE `user` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `firstName` varchar(50) DEFAULT NULL,
  `lastName` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(50) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` varchar(200) DEFAULT NULL,
  `gender` varchar(50),
  `imageUrl` varchar(200) DEFAULT NULL,
  `bgImageUrl` varchar(200) DEFAULT NULL,
  `city` varchar(50) DEFAULT NULL,
  `state` varchar(50) DEFAULT NULL,
  `country` varchar(50) DEFAULT NULL,
  `roleId` bigint(20) DEFAULT NULL,
  `workingStatus` varchar(40) DEFAULT 'inactive',
  `loginStatus` varchar(50) DEFAULT NULL,
  `regDate` datetime DEFAULT NULL,
  `lastLogin` datetime DEFAULT NULL,
  `lastSeen` datetime DEFAULT NULL,
  `registeredBy` bigint(20) DEFAULT 0,
  `avatarBG` varchar(14) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
);

-- -----------------------------------------------------
-- Table `login_history`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `login_history`;
CREATE TABLE `login_history` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `userId` bigint(20) DEFAULT NULL,
  `browserId` bigint(20) DEFAULT NULL,
  `operatingSystem` varchar(100) DEFAULT NULL,
  `ip` varchar(100) DEFAULT NULL,
  `loginTime` datetime DEFAULT current_timestamp(),
  `logTime` datetime DEFAULT NULL,
  `loginStatus` varchar(40) DEFAULT NULL,
  `browser` varchar(40) DEFAULT NULL,
  PRIMARY KEY (`id`)
);

-- -----------------------------------------------------
-- Table `verification`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `verification`;
CREATE TABLE `verification` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `userId` bigint(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `otp` int(11) DEFAULT NULL,
  `sentAt` datetime DEFAULT NULL,
  `verifiedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
);

-- -----------------------------------------------------
-- Table `age_range`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `age_range`;
CREATE TABLE `age_range` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `min` bigint(20) DEFAULT NULL,
  `max` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
);

-- -----------------------------------------------------
-- Table `gender`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `gender`;
CREATE TABLE `gender` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
);
