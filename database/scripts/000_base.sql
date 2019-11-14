-- -----------------------------------------------------
-- Schema lokpoll
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `lokpoll` ;
CREATE SCHEMA IF NOT EXISTS `lokpoll` DEFAULT CHARACTER SET utf8 ;
USE `lokpoll` ;

-- -----------------------------------------------------
-- Table `userRole`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `userRole`;
CREATE TABLE `userrole` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
);

-- -----------------------------------------------------
-- Table `dblogs`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `dblogs` ;
CREATE TABLE `dblogs` (
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
  `alternateEmail` varchar(100) DEFAULT NULL,
  `password` varchar(50) DEFAULT NULL,
  `residentialAddress` varchar(200) DEFAULT NULL,
  `imageUrl` varchar(200) DEFAULT NULL,
  `adharUrl` varchar(200) DEFAULT NULL,
  `passportUrl` varchar(200) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `country` varchar(50) DEFAULT NULL,
  `roleId` bigint(20) DEFAULT NULL,
  `workingStatus` varchar(40) DEFAULT 'inactive',
  `loginStatus` varchar(50) DEFAULT NULL,
  `regDate` datetime DEFAULT NULL,
  `lastLogin` datetime DEFAULT NULL,
  `lastSeen` datetime DEFAULT NULL,
  `phoneOTP` tinyint(20) DEFAULT NULL,
  `inviterId` bigint(20) DEFAULT NULL,
  `approverId` bigint(20) DEFAULT NULL,
  `invitationDate` datetime DEFAULT NULL,
  `approvalDate` datetime DEFAULT NULL,
  `creatorId` bigint(20) DEFAULT NULL,
  `firmId` bigint(20) DEFAULT NULL,
  `avatarBG` varchar(14) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `roleId` (`roleId`),
  CONSTRAINT `user_ibfk_1` FOREIGN KEY (`roleId`) REFERENCES `userrole` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- -----------------------------------------------------
-- Table `loginHistory`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `loginHistory`;
CREATE TABLE `loginhistory` (
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
