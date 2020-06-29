insert into db_logs (`dev`, scriptName) values ('ritu', '025_challenge_entries_tables_created .sql');

-- -----------------------------------------------------
-- Table `post`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `challenge_entries`;
CREATE TABLE `challenge_entries` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `userId` bigint(20) DEFAULT 0,
  `moodId` bigint(20) DEFAULT 0,
  `description` longtext DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `latitude` varchar(100) DEFAULT NULL,
  `longitude` varchar(100) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `isActive` tinyint(2) DEFAULT 0,
  `isVerified` tinyint(2) DEFAULT 0,
  `verifiedBy` bigint(20) DEFAULT 0,
  `verifiedAt` datetime DEFAULT NULL,
  `profileType` varchar(20) DEFAULT NULL,
  `source` varchar(200) DEFAULT NULL,
  `isPostUpload` varchar(50) DEFAULT NULL,
  `language` varchar(50) DEFAULT NULL,
  `type` varchar(20) DEFAULT NULL,
  `isDeleted` tinyint(2) DEFAULT 0,
  `creatorId` bigint(20) DEFAULT 0,
  PRIMARY KEY (`id`)
);


-- -----------------------------------------------------
-- Table `post_media`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `challenge_entries_media`;
CREATE TABLE `challenge_entries_media` (
   `id` bigint(20) NOT NULL AUTO_INCREMENT,
   `challengeEntryId` bigint(20) DEFAULT 0,
   `commentId` bigint(20) DEFAULT 0,
   `type` varchar(100) DEFAULT NULL,
   `url` longtext DEFAULT NULL,
   `thumbnailUrl` longtext DEFAULT NULL,
   PRIMARY KEY (`id`)
);

-- -----------------------------------------------------
-- Table `post_location`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `challenge_entries_location`;
CREATE TABLE `challenge_entries_location` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `challengeEntryId` bigint(20) DEFAULT 0,
  `latitude` varchar(100) DEFAULT NULL,
  `longitude` varchar(100) DEFAULT NULL,
  `address` longtext DEFAULT NULL,
  `pinCode` varchar(100) DEFAULT NULL,
   PRIMARY KEY (`id`)
);

-- -----------------------------------------------------
-- Table `post_reaction`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `challenge_entries_reaction`;
CREATE TABLE `challenge_entries_reaction` (
   `id` bigint(20) NOT NULL AUTO_INCREMENT,
   `challengeEntryId` bigint(20) DEFAULT 0,
   `reactedBy` bigint(20) DEFAULT 0,
   `type` varchar(100) DEFAULT NULL,
   `reactedAt` datetime DEFAULT NULL,
   PRIMARY KEY (`id`)
);

-- -----------------------------------------------------
-- Table `post_comment`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `challenge_entries_comment`;
CREATE TABLE `challenge_entries_comment` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `challengeEntryId` bigint(20) DEFAULT 0,
  `replyToCommentId` bigint(20) DEFAULT 0,
  `userId` bigint(20) DEFAULT 0,
  `comment` longtext DEFAULT NULL,
  `level` int NULL DEFAULT 0,
  `isDeleted` tinyint(2) DEFAULT 0,
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
);

alter table challenge_entries change latitude latitude double default null, change longitude longitude double default null;
